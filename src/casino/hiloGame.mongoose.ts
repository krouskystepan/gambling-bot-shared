import { Schema } from 'mongoose'

import { THiloGame } from './types/hiloGame'

const hiloCardSchema = new Schema(
  {
    label: { type: String, required: true },
    suite: { type: String, required: true },
    rank: { type: Number, required: true }
  },
  { _id: false }
)

const sessionStatsSchema = new Schema(
  {
    roundsPlayed: { type: Number, required: true, default: 0 },
    totalWagered: { type: Number, required: true, default: 0 },
    totalPayout: { type: Number, required: true, default: 0 },
    netProfit: { type: Number, required: true, default: 0 }
  },
  { _id: false }
)

export const HiloGameSchema = new Schema<THiloGame>(
  {
    userId: { type: String, required: true, index: true },
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, required: true },
    messageId: { type: String, required: true },
    gameId: { type: String, required: true, index: true },
    activeBetId: { type: String, default: null, index: true },

    betAmount: { type: Number, default: null },
    firstCard: { type: hiloCardSchema, default: null },
    remainingDeck: { type: [hiloCardSchema], required: true, default: [] },
    currentMultiplier: { type: Number, required: true, default: 1 },
    streak: { type: Number, required: true, default: 0 },
    houseEdgeSnapshot: { type: Number, required: true, default: 0 },
    showBalance: { type: Boolean, required: true, default: false },
    skipAnimations: { type: Boolean, required: true, default: false },

    status: {
      type: String,
      enum: ['BETTING', 'WAITING', 'SETTLING', 'RESULT'],
      required: true,
      default: 'BETTING'
    },
    sessionStats: {
      type: sessionStatsSchema,
      required: true,
      default: () => ({
        roundsPlayed: 0,
        totalWagered: 0,
        totalPayout: 0,
        netProfit: 0
      })
    },

    idleNudgeSentAt: { type: Date, default: null }
  },
  { timestamps: true }
)

HiloGameSchema.index({ userId: 1, guildId: 1 }, { unique: true })
HiloGameSchema.index({ status: 1, createdAt: 1 })
HiloGameSchema.index({ status: 1, updatedAt: 1 })
