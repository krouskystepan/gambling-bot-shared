import type { CasinoGameId } from '../../casino/constants/casinoGames'
import type { QuestCondition } from '../types/quest'

export type QuestActivityStats = {
  casinoWins: number
  casinoBets: number
  casinoWinnings: number
  /** Sum of win amounts minus sum of bet amounts (excludes bonus). */
  netProfit: number
  bonusClaims: number
  vipPurchases: number
}

export type QuestUserStreakSnapshot = {
  dailyStreak: number
}

/** Compute current progress value for a quest condition from pre-aggregated stats. */
export const computeQuestProgressValue = (
  condition: QuestCondition,
  stats: QuestActivityStats,
  user: QuestUserStreakSnapshot
): number => {
  switch (condition.type) {
    case 'casino_wins':
      return stats.casinoWins
    case 'casino_bets':
      return stats.casinoBets
    case 'casino_winnings':
      return stats.casinoWinnings
    case 'net_profit':
      return stats.netProfit
    case 'bonus_claims':
      return stats.bonusClaims
    case 'bonus_streak':
      return user.dailyStreak
    case 'vip_purchase':
      return stats.vipPurchases
    default:
      return 0
  }
}

export const isQuestThresholdMet = (
  progress: number,
  threshold: number
): boolean => progress >= threshold

export const resolveQuestThreshold = (condition: QuestCondition): number =>
  Math.max(
    0,
    condition.threshold ?? (condition.type === 'vip_purchase' ? 1 : 0)
  )

/** Human-readable condition summary for admin/Discord. */
export const formatQuestConditionSummary = (
  condition: QuestCondition
): string => {
  const threshold = resolveQuestThreshold(condition)
  const gameLabel = condition.game ? ` (${condition.game})` : ''

  switch (condition.type) {
    case 'casino_wins':
      return `Win ${threshold} casino game${threshold === 1 ? '' : 's'}${gameLabel}`
    case 'casino_bets':
      return `Place ${threshold} casino bet${threshold === 1 ? '' : 's'}${gameLabel}`
    case 'casino_winnings':
      return `Earn ${threshold} in casino winnings${gameLabel}`
    case 'net_profit':
      return `Reach ${threshold} net profit`
    case 'bonus_claims':
      return `Claim daily bonus ${threshold} time${threshold === 1 ? '' : 's'}`
    case 'bonus_streak':
      return `Reach a ${threshold}-day bonus streak`
    case 'vip_purchase':
      return `Purchase VIP ${threshold} time${threshold === 1 ? '' : 's'}`
    default:
      return 'Unknown condition'
  }
}

export type AggregateGameFilter = CasinoGameId | undefined
