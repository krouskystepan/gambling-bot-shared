import { defaultCasinoSettings } from '../constants'

export type RewardMode = 'linear' | 'exponential'

export type TGuildConfiguration = {
  guildId: string
  atmChannelIds: {
    actions: string
    logs: string
  }
  casinoChannelIds: string[]
  predictionChannelIds: {
    actions: string
    logs: string
  }
  managerRoleId: string
  casinoSettings: typeof defaultCasinoSettings
  vipSettings: {
    roleId: string
    categoryId: string
    pricePerDay: number
    pricePerCreate: number
  }
  bonusSettings: {
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
}
