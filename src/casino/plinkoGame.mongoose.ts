import { Schema } from 'mongoose'

import { TPlinkoGame } from './types/plinkoGame'

export const PlinkoGameSchema = new Schema<TPlinkoGame>(
  {
    userId: { type: String, required: true, index: true },
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, required: true },
    messageId: { type: String, required: true },
    gameId: { type: String, required: true, index: true },
    showBalance: { type: Boolean, required: true, default: false },
    skipAnimations: { type: Boolean, required: true, default: false },
    unitBet: { type: Number, default: null },
    ballsCount: { type: Number, required: true, default: 1, min: 1, max: 10 },
    phase: {
      type: String,
      required: true,
      enum: ['ready', 'dropping', 'result'],
      default: 'ready'
    },
    lastNetResult: { type: Number, default: null },
    lastBallsCount: { type: Number, default: null },
    lastTotalBet: { type: Number, default: null },
    lastWinsCount: { type: Number, default: null },
    pendingBatchResults: { type: [[Number]], default: null },
    activeBetId: { type: String, default: null, index: true },
    lockedAmount: { type: Number, default: null },
    sessionStats: {
      type: new Schema(
        {
          roundsPlayed: { type: Number, required: true, default: 0 },
          totalWagered: { type: Number, required: true, default: 0 },
          totalPayout: { type: Number, required: true, default: 0 },
          netProfit: { type: Number, required: true, default: 0 }
        },
        { _id: false }
      ),
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

PlinkoGameSchema.index({ userId: 1, guildId: 1 }, { unique: true })
