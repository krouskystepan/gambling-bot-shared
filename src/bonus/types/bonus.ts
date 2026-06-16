import type { RewardMode } from '../../guild/types/guildConfiguration'

export type BonusSettings = {
  rewardMode: RewardMode
  baseReward: number
  streakIncrement?: number
  streakMultiplier?: number
  maxReward: number
  resetOnMax: boolean
  milestoneBonus: {
    weekly: number
    monthly: number
  }
}
