import z from 'zod'

import {
  CASINO_GAME_IDS,
  type CasinoGameId
} from '../../casino/constants/casinoGames'
import { num } from '../../common/zod'
import {
  QUEST_CONDITION_TYPES,
  QUEST_KINDS,
  QUEST_MAX_DESCRIPTION_LENGTH,
  QUEST_MAX_NAME_LENGTH,
  QUEST_MAX_REWARD_AMOUNT,
  QUEST_MAX_THRESHOLD
} from '../constants/questLimits'
import { isQuestConditionAllowedForKind } from '../utils/questCondition'

const casinoGameEnum = z.enum(
  CASINO_GAME_IDS as [CasinoGameId, ...CasinoGameId[]]
)

const questAmountSchema = num.pipe(
  z
    .number()
    .min(0, 'Must be ≥ 0')
    .max(QUEST_MAX_REWARD_AMOUNT, `Must be ≤ ${QUEST_MAX_REWARD_AMOUNT}`)
)

const questThresholdSchema = num.pipe(
  z
    .number()
    .int('Must be an integer')
    .min(1, 'Must be ≥ 1')
    .max(QUEST_MAX_THRESHOLD, `Must be ≤ ${QUEST_MAX_THRESHOLD}`)
)

const questConditionSchema = z.object({
  type: z.enum(QUEST_CONDITION_TYPES),
  threshold: questThresholdSchema,
  game: casinoGameEnum.optional()
})

const questBaseFields = {
  name: z.string().trim().min(1).max(QUEST_MAX_NAME_LENGTH),
  description: z.string().trim().max(QUEST_MAX_DESCRIPTION_LENGTH).default(''),
  kind: z.enum(QUEST_KINDS),
  condition: questConditionSchema,
  rewardAmount: questAmountSchema,
  enabled: z.boolean().default(true),
  sortOrder: num.pipe(z.number().int().min(0).max(10_000)).default(0)
}

const refineConditionForKind = <
  T extends {
    kind: z.infer<typeof questBaseFields.kind>
    condition: z.infer<typeof questConditionSchema>
  }
>(
  data: T,
  ctx: z.RefinementCtx
) => {
  if (!isQuestConditionAllowedForKind(data.condition.type, data.kind)) {
    ctx.addIssue({
      code: 'custom',
      message: `Condition "${data.condition.type}" is not allowed for ${data.kind} quests`,
      path: ['condition', 'type']
    })
  }

  const gameTypes = new Set([
    'casino_wins',
    'casino_bets',
    'casino_winnings'
  ] as const)
  if (!gameTypes.has(data.condition.type as never) && data.condition.game) {
    ctx.addIssue({
      code: 'custom',
      message:
        'Game filter is only valid for casino win/bet/winnings conditions',
      path: ['condition', 'game']
    })
  }
}

export const createQuestFormSchema = z
  .object(questBaseFields)
  .superRefine(refineConditionForKind)

export const updateQuestFormSchema = z
  .object({
    ...questBaseFields,
    questId: z.string().min(1)
  })
  .superRefine(refineConditionForKind)
