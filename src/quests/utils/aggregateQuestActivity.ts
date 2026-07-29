import type { ClientSession, Model } from 'mongoose'

import type { CasinoGameId } from '../../casino/constants/casinoGames'
import { guildCalendarRangeToUtc } from '../../guild/utils/guildTimezone'
import type { TTransaction } from '../../transactions/types/transaction'
import type { QuestActivityStats } from '../utils/computeQuestProgress'

type TxLean = Pick<TTransaction, 'type' | 'amount' | 'meta'>

const isDailyBonusClaim = (tx: TxLean): boolean => {
  if (tx.type !== 'bonus') return false
  const meta = tx.meta
  if (!meta || typeof meta !== 'object') return false
  if ('questId' in meta || 'questStreakMilestone' in meta) return false
  return 'bonusStreak' in meta
}

const isVipPurchase = (tx: TxLean): boolean => {
  if (tx.type !== 'vip') return false
  const action = tx.meta?.action
  return action === 'buy-finalize' || action === undefined
}

const matchesGame = (tx: TxLean, game: CasinoGameId | undefined): boolean => {
  if (!game) return true
  return tx.meta?.game === game
}

export const emptyQuestActivityStats = (): QuestActivityStats => ({
  casinoWins: 0,
  casinoBets: 0,
  casinoWinnings: 0,
  netProfit: 0,
  bonusClaims: 0,
  vipPurchases: 0
})

export const aggregateQuestActivityFromTransactions = (
  transactions: TxLean[],
  game?: CasinoGameId
): QuestActivityStats => {
  const stats = emptyQuestActivityStats()

  for (const tx of transactions) {
    if (tx.type === 'win' && matchesGame(tx, game)) {
      stats.casinoWins += 1
      stats.casinoWinnings += tx.amount
      stats.netProfit += tx.amount
    } else if (tx.type === 'bet' && matchesGame(tx, game)) {
      stats.casinoBets += 1
      stats.netProfit -= tx.amount
    } else if (isDailyBonusClaim(tx)) {
      stats.bonusClaims += 1
    } else if (isVipPurchase(tx)) {
      stats.vipPurchases += 1
    }
  }

  return stats
}

export async function loadQuestActivityStats({
  transactionModel,
  userId,
  guildId,
  dateKey,
  timezone,
  game,
  session
}: {
  transactionModel: Model<TTransaction>
  userId: string
  guildId: string
  /** When set, only include txns in that guild calendar day. */
  dateKey: string | null
  timezone?: string | null
  game?: CasinoGameId
  session?: ClientSession | null
}): Promise<QuestActivityStats> {
  const filter: Record<string, unknown> = { userId, guildId }

  if (dateKey) {
    const { start, end } = guildCalendarRangeToUtc(dateKey, dateKey, timezone)
    filter.createdAt = { $gte: start, $lte: end }
  }

  const query = transactionModel
    .find(filter)
    .select({ type: 1, amount: 1, meta: 1 })

  if (session) {
    query.session(session)
  }

  const transactions = (await query.lean()) as TxLean[]
  return aggregateQuestActivityFromTransactions(transactions, game)
}
