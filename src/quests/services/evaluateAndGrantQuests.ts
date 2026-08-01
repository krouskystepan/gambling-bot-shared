import type { ClientSession, Model } from 'mongoose'

import { generateId } from '../../common/generateId'
import type { TTransaction } from '../../transactions/types/transaction'
import type { TUser } from '../../user/types/user'
import type { TQuest, TUserQuestProgress } from '../types/quest'
import {
  emptyQuestActivityStats,
  loadQuestActivityStats
} from '../utils/aggregateQuestActivity'
import {
  type QuestActivityStats,
  computeQuestProgressValue,
  isQuestThresholdMet,
  resolveQuestThreshold
} from '../utils/computeQuestProgress'
import { getQuestDateKey } from '../utils/questDateKey'
import { getQuestDailyStreakAfterCompletion } from '../utils/questStreak'
import type { CompletedQuestGrant, EvaluateAndGrantQuestsResult } from './types'

export type EvaluateAndGrantQuestsModels = {
  questModel: Model<TQuest>
  progressModel: Model<TUserQuestProgress>
  userModel: Model<TUser>
  transactionModel: Model<TTransaction>
}

export type EvaluateAndGrantQuestsInput = {
  guildId: string
  userId: string
  models: EvaluateAndGrantQuestsModels
  timezone?: string | null
  disableQuests?: boolean
  now?: Date
  session?: ClientSession | null
}

const emptyResult = (questDailyStreak = 0): EvaluateAndGrantQuestsResult => ({
  completed: [],
  questDailyStreak
})

async function grantBonusReward({
  userModel,
  transactionModel,
  userId,
  guildId,
  amount,
  meta,
  session
}: {
  userModel: Model<TUser>
  transactionModel: Model<TTransaction>
  userId: string
  guildId: string
  amount: number
  meta: Record<string, unknown>
  session: ClientSession | null | undefined
}) {
  if (amount <= 0) return

  await userModel.findOneAndUpdate(
    { userId, guildId },
    { $inc: { bonusBalance: amount } },
    { returnDocument: 'after', session: session ?? undefined }
  )

  await transactionModel.create(
    [
      {
        userId,
        guildId,
        amount,
        type: 'bonus',
        source: 'system',
        referenceId: generateId('quest'),
        meta
      }
    ],
    { session: session ?? undefined }
  )
}

/**
 * Evaluate enabled quests for a user and auto-credit bonus rewards on completion.
 * Idempotent via unique progress keys + rewardedAt guards.
 */
export async function evaluateAndGrantQuests(
  input: EvaluateAndGrantQuestsInput
): Promise<EvaluateAndGrantQuestsResult> {
  const {
    guildId,
    userId,
    models,
    timezone,
    disableQuests,
    now = new Date(),
    session
  } = input

  if (disableQuests) {
    return emptyResult()
  }

  const dateKey = getQuestDateKey(now, timezone)
  const sessionOrNull = session ?? null

  const quests = (await models.questModel
    .find({ guildId, enabled: true })
    .sort({ sortOrder: 1, createdAt: 1 })
    .session(sessionOrNull)
    .lean()) as TQuest[]

  const user = await models.userModel
    .findOne({ userId, guildId })
    .session(sessionOrNull)
    .lean()

  if (!user) {
    return emptyResult()
  }

  if (!quests.length) {
    return emptyResult(user.questDailyStreak ?? 0)
  }

  const completed: CompletedQuestGrant[] = []
  let questDailyStreak = user.questDailyStreak ?? 0
  let grantedFirstDailyToday = false

  const statsCache = new Map<string, QuestActivityStats>()

  const getStats = async (
    kind: TQuest['kind'],
    game: TQuest['condition']['game']
  ): Promise<QuestActivityStats> => {
    const scopeDateKey = kind === 'daily' ? dateKey : null
    const cacheKey = `${scopeDateKey ?? 'lifetime'}:${game ?? '*'}`
    const cached = statsCache.get(cacheKey)
    if (cached) return cached

    const stats = await loadQuestActivityStats({
      transactionModel: models.transactionModel,
      userId,
      guildId,
      dateKey: scopeDateKey,
      timezone,
      game,
      activityAfter: user.questActivityAfter ?? null,
      session: sessionOrNull
    })
    statsCache.set(cacheKey, stats)
    return stats
  }

  const writeOpts = {
    returnDocument: 'after' as const,
    session: session ?? undefined
  }
  const upsertOpts = {
    upsert: true as const,
    ...writeOpts
  }

  for (const quest of quests) {
    const progressDateKey = quest.kind === 'daily' ? dateKey : null
    const upsertFilter = {
      guildId,
      userId,
      questId: quest.questId,
      dateKey: progressDateKey
    }

    const existing = await models.progressModel
      .findOne(upsertFilter)
      .session(sessionOrNull)
      .lean()

    if (existing?.rewardedAt) {
      continue
    }

    const stats =
      quest.condition.type === 'bonus_streak'
        ? emptyQuestActivityStats()
        : await getStats(quest.kind, quest.condition.game)

    const progress = computeQuestProgressValue(quest.condition, stats, {
      dailyStreak: user.dailyStreak ?? 0
    })
    const threshold = resolveQuestThreshold(quest.condition)

    if (!isQuestThresholdMet(progress, threshold)) {
      await models.progressModel.findOneAndUpdate(
        upsertFilter,
        {
          $set: { progress },
          $setOnInsert: {
            completedAt: null,
            rewardedAt: null
          }
        },
        upsertOpts
      )
      continue
    }

    await models.progressModel.findOneAndUpdate(
      upsertFilter,
      {
        $set: { progress },
        $setOnInsert: {
          completedAt: null,
          rewardedAt: null
        }
      },
      upsertOpts
    )

    const claimed = await models.progressModel.findOneAndUpdate(
      { ...upsertFilter, rewardedAt: null },
      {
        $set: {
          progress,
          completedAt: now,
          rewardedAt: now
        }
      },
      writeOpts
    )

    if (!claimed) {
      continue
    }

    await grantBonusReward({
      userModel: models.userModel,
      transactionModel: models.transactionModel,
      userId,
      guildId,
      amount: quest.rewardAmount,
      meta: {
        questId: quest.questId,
        questName: quest.name,
        kind: quest.kind,
        ...(progressDateKey ? { dateKey: progressDateKey } : {})
      },
      session: sessionOrNull
    })

    completed.push({
      quest,
      progress,
      rewardAmount: quest.rewardAmount,
      kind: quest.kind,
      dateKey: progressDateKey
    })

    if (
      quest.kind === 'daily' &&
      !grantedFirstDailyToday &&
      user.lastQuestDailyCompleteDate !== dateKey
    ) {
      grantedFirstDailyToday = true
    }
  }

  if (grantedFirstDailyToday) {
    const nextStreak = getQuestDailyStreakAfterCompletion(
      user.lastQuestDailyCompleteDate,
      dateKey,
      user.questDailyStreak ?? 0,
      timezone
    )

    const updatedUser = await models.userModel.findOneAndUpdate(
      {
        userId,
        guildId,
        $or: [
          { lastQuestDailyCompleteDate: { $ne: dateKey } },
          { lastQuestDailyCompleteDate: null },
          { lastQuestDailyCompleteDate: { $exists: false } }
        ]
      },
      {
        $set: {
          questDailyStreak: nextStreak,
          lastQuestDailyCompleteDate: dateKey
        }
      },
      writeOpts
    )

    if (updatedUser) {
      questDailyStreak = nextStreak
    }
  }

  return {
    completed,
    questDailyStreak
  }
}
