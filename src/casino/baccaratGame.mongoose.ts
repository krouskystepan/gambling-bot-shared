import { Schema } from 'mongoose'

import { TBaccaratGame } from './types/baccaratGame'

const baccaratCardSchema = new Schema(
  {
    label: { type: String, required: true },
    suite: { type: String, required: true }
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

export const BaccaratGameSchema = new Schema<TBaccaratGame>(
  {
    userId: { type: String, required: true, index: true },
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, required: true },
    messageId: { type: String, required: true },
    gameId: { type: String, required: true, index: true },
    activeBetId: { type: String, default: null, index: true },
    betAmount: { type: Number, required: true },
    lastSide: { type: String, default: null },
    showBalance: { type: Boolean, required: true, default: false },
    skipAnimations: { type: Boolean, required: true, default: false },
    phase: {
      type: String,
      required: true,
      enum: ['waiting', 'dealing', 'result'],
      default: 'waiting'
    },
    pendingDeal: {
      type: new Schema(
        {
          side: { type: String, required: true },
          playerCards: {
            type: [baccaratCardSchema],
            required: true,
            default: []
          },
          bankerCards: {
            type: [baccaratCardSchema],
            required: true,
            default: []
          }
        },
        { _id: false }
      ),
      default: null
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

BaccaratGameSchema.index({ userId: 1, guildId: 1 }, { unique: true })
