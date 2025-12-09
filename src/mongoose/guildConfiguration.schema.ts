import { Schema } from 'mongoose'
import { defaultCasinoSettings } from '../constants'
import { TGuildConfiguration } from '../types'

export const GuildConfigurationSchema = new Schema<TGuildConfiguration>({
  guildId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  atmChannelIds: {
    actions: {
      type: String,
      default: '',
    },
    logs: {
      type: String,
      default: '',
    },
  },
  casinoChannelIds: {
    type: [String],
    default: [],
  },
  predictionChannelIds: {
    actions: {
      type: String,
      default: '',
    },
    logs: {
      type: String,
      default: '',
    },
  },
  managerRoleId: {
    type: String,
    default: '',
  },
  casinoSettings: {
    type: Schema.Types.Mixed,
    default: defaultCasinoSettings,
  },
  vipSettings: {
    roleOwnerId: {
      type: String,
      default: '',
    },
    roleMemberId: {
      type: String,
      default: '',
    },
    categoryId: {
      type: String,
      default: '',
    },
    pricePerDay: {
      type: Number,
      default: 0,
    },
    pricePerCreate: {
      type: Number,
      default: 0,
    },
    pricePerAdditionalMember: {
      type: Number,
      default: 0,
    },
  },
  bonusSettings: {
    rewardMode: {
      type: String,
      enum: ['linear', 'exponential'],
      default: 'linear',
    },
    baseReward: { type: Number, default: 0 },
    streakIncrement: { type: Number, default: 0 },
    streakMultiplier: { type: Number, default: 0 },
    maxReward: { type: Number, default: 0 },
    resetOnMax: { type: Boolean, default: false },
    milestoneBonus: {
      weekly: { type: Number, default: 0 },
      monthly: { type: Number, default: 0 },
    },
  },
})
