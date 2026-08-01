import { Schema } from 'mongoose'

import { TMinesGame } from './types/minesGame'

const sessionStatsSchema = new Schema(
  {
    roundsPlayed: { type: Number, required: true, default: 0 },
    totalWagered: { type: Number, required: true, default: 0 },
    totalPayout: { type: Number, required: true, default: 0 },
    netProfit: { type: Number, required: true, default: 0 }
  },
  { _id: false }
)

export const MinesGameSchema = new Schema<TMinesGame>(
  {
    userId: { type: String, required: true, index: true },
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, required: true },
    messageId: { type: String, required: true },
    gameId: { type: String, required: true, index: true },
    activeBetId: { type: String, default: null, index: true },

    betAmount: { type: Number, required: true },
    mineCount: { type: Number, required: true },
    mineIndices: { type: [Number], required: true, default: [] },
    revealedIndices: { type: [Number], required: true, default: [] },
    houseEdgeSnapshot: { type: Number, required: true },

    status: {
      type: String,
      enum: ['ACTIVE', 'RESULT'],
      required: true,
      default: 'ACTIVE'
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
    showBalance: { type: Boolean, required: true, default: false },

    idleNudgeSentAt: { type: Date, default: null }
  },
  { timestamps: true }
)

MinesGameSchema.index({ userId: 1, guildId: 1 }, { unique: true })
