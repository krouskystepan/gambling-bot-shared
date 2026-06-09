import { defaultCasinoSettings } from '../constants'
import type { GlobalSettings } from '../constants/defaultGlobalSettings'
import { BonusSettings } from './bonus'

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
  managerRoleId: string
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
