import { Schema } from 'mongoose'

import { TRouletteGame } from './types/rouletteGame'

const RouletteSlipBetSchema = new Schema(
  {
    amount: { type: Number, required: true },
    type: { type: String, required: true },
    value: { type: String, required: true },
    displayValue: { type: String, required: true }
  },
  { _id: false }
)

export const RouletteGameSchema = new Schema<TRouletteGame>(
  {
    userId: { type: String, required: true, index: true },
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, required: true },
    messageId: { type: String, required: true },
    gameId: { type: String, required: true, index: true },
    showBalance: { type: Boolean, required: true, default: false },
    skipAnimations: { type: Boolean, required: true, default: false },
    phase: {
      type: String,
      required: true,
      enum: ['betting', 'spinning', 'result'],
      default: 'betting'
    },
    bets: { type: [RouletteSlipBetSchema], required: true, default: [] },
    lastBets: { type: [RouletteSlipBetSchema], required: true, default: [] },
    lastSpinResult: { type: String, default: null },
    pendingSpinResult: { type: String, default: null },
    lastNetResult: { type: Number, default: null },
    activeBetId: { type: String, default: null, index: true },
    lockedAmount: { type: Number, default: null },
    idleNudgeSentAt: { type: Date, default: null }
  },
  { timestamps: true }
)

RouletteGameSchema.index({ userId: 1, guildId: 1 }, { unique: true })
