import { Schema } from 'mongoose'

import { TSlotsGame } from './types/slotsGame'

export const SlotsGameSchema = new Schema<TSlotsGame>(
  {
    userId: { type: String, required: true, index: true },
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, required: true },
    messageId: { type: String, required: true },
    gameId: { type: String, required: true, index: true },
    showBalance: { type: Boolean, required: true, default: false },
    skipAnimations: { type: Boolean, required: true, default: false },
    unitBet: { type: Number, default: null },
    spinsCount: { type: Number, required: true, default: 1, min: 1, max: 10 },
    phase: {
      type: String,
      required: true,
      enum: ['ready', 'spinning', 'result'],
      default: 'ready'
    },
    lastReels: { type: String, default: null },
    lastNetResult: { type: Number, default: null },
    lastSpinsCount: { type: Number, default: null },
    lastTotalBet: { type: Number, default: null },
    lastWinsCount: { type: Number, default: null },
    pendingBatchResults: { type: [String], default: null },
    activeBetId: { type: String, default: null, index: true },
    lockedAmount: { type: Number, default: null },
    idleNudgeSentAt: { type: Date, default: null }
  },
  { timestamps: true }
)

SlotsGameSchema.index({ userId: 1, guildId: 1 }, { unique: true })
