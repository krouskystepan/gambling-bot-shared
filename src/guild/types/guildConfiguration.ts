import type { BonusSettings } from '../../bonus/types/bonus'
import { defaultCasinoSettings } from '../../casino/constants/defaultConfig'
import type { GlobalSettings } from '../constants/defaultGlobalSettings'

export type RewardMode = 'linear' | 'exponential'

export type TGuildConfiguration = {
  guildId: string
  atmChannelIds: {
    actions: string
    logs: string
  }
  casinoChannelIds: string[]
  winAnnouncementsChannelId: string
  predictionChannelIds: {
    actions: string
    logs: string
  }
  raffleChannelIds: {
    actions: string
    logs: string
  }
  workerLogChannelId: string
  managerRoleId: string
  bannedRoleId: string
  casinoSettings: typeof defaultCasinoSettings
  vipSettings: {
    roleOwnerId: string
    roleMemberId: string
    categoryId: string
    pricePerDay: number
    pricePerCreate: number
    pricePerAdditionalMember: number
    maxMembers: number
  }
  bonusSettings: BonusSettings
  globalSettings?: GlobalSettings
}

export type { GlobalSettings } from '../constants/defaultGlobalSettings'
