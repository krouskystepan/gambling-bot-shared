import { Schema } from 'mongoose'

import { defaultCasinoSettings } from '../casino/constants/defaultConfig'
import { defaultGlobalSettings } from './constants/defaultGlobalSettings'
import { TGuildConfiguration } from './types/guildConfiguration'

export const GuildConfigurationSchema = new Schema<TGuildConfiguration>({
  guildId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  atmChannelIds: {
    actions: {
      type: String,
      default: ''
    },
    logs: {
      type: String,
      default: ''
    }
  },
  casinoChannelIds: {
    type: [String],
    default: []
  },
  winAnnouncementsChannelId: {
    type: String,
    default: ''
  },
  predictionChannelIds: {
    actions: {
      type: String,
      default: ''
    },
    logs: {
      type: String,
      default: ''
    }
  },
  raffleChannelIds: {
    actions: {
      type: String,
      default: ''
    },
    logs: {
      type: String,
      default: ''
    }
  },
  managerRoleId: {
    type: String,
    default: ''
  },
  bannedRoleId: {
    type: String,
    default: ''
  },
  casinoSettings: {
    type: Schema.Types.Mixed,
    default: defaultCasinoSettings
  },
  vipSettings: {
    roleOwnerId: {
      type: String,
      default: ''
    },
    roleMemberId: {
      type: String,
      default: ''
    },
    categoryId: {
      type: String,
      default: ''
    },
    pricePerDay: {
      type: Number,
      default: 0
    },
    pricePerCreate: {
      type: Number,
      default: 0
    },
    pricePerAdditionalMember: {
      type: Number,
      default: 0
    },
    maxMembers: {
      type: Number,
      default: 2
    }
  },
  bonusSettings: {
    rewardMode: {
      type: String,
      enum: ['linear', 'exponential'],
      default: 'linear'
    },
    baseReward: { type: Number, default: 0 },
    streakIncrement: { type: Number, default: 0 },
    streakMultiplier: { type: Number, default: 0 },
    maxReward: { type: Number, default: 0 },
    resetOnMax: { type: Boolean, default: false },
    milestoneBonus: {
      weekly: { type: Number, default: 0 },
      monthly: { type: Number, default: 0 }
    }
  },
  globalSettings: {
    disableRegistrations: { type: Boolean, default: false },
    disableDeposits: { type: Boolean, default: false },
    disableWithdrawals: { type: Boolean, default: false },
    disableCasinoGames: { type: Boolean, default: false },
    disableCasinoGamesForMods: { type: Boolean, default: false },
    disablePredictions: { type: Boolean, default: false },
    disablePredictionManagement: { type: Boolean, default: false },
    disableRaffles: { type: Boolean, default: false },
    disableRaffleManagement: { type: Boolean, default: false },
    disableDailyBonus: { type: Boolean, default: false },
    disableVip: { type: Boolean, default: false },
    maintenanceMode: { type: Boolean, default: false },
    timezone: { type: String, default: defaultGlobalSettings.timezone },
    currencySymbol: {
      type: String,
      default: defaultGlobalSettings.currencySymbol
    },
    currencyPlacement: {
      type: String,
      enum: ['prefix', 'suffix'],
      default: defaultGlobalSettings.currencyPlacement
    }
  }
})
