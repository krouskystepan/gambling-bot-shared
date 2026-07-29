import type { CasinoGameId } from '../../casino/constants/casinoGames'

export type QuestKind = 'daily' | 'normal'

export type QuestConditionType =
  | 'casino_wins'
  | 'casino_bets'
  | 'casino_winnings'
  | 'net_profit'
  | 'bonus_claims'
  | 'bonus_streak'
  | 'vip_purchase'

export type QuestCondition = {
  type: QuestConditionType
  threshold: number
  game?: CasinoGameId
}

export type TQuest = {
  questId: string
  guildId: string
  name: string
  description: string
  kind: QuestKind
  condition: QuestCondition
  rewardAmount: number
  enabled: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export type TUserQuestProgress = {
  userId: string
  guildId: string
  questId: string
  /** yyyy-MM-dd in guild TZ for daily; null for normal */
  dateKey: string | null
  progress: number
  completedAt: Date | null
  rewardedAt: Date | null
  createdAt: Date
  updatedAt: Date
}
