import { Schema } from 'mongoose'

import { TBaccaratGame } from './types/baccaratGame'

export const BaccaratGameSchema = new Schema<TBaccaratGame>(
  {
    userId: { type: String, required: true, index: true },
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, required: true },
    messageId: { type: String, required: true },
    betId: { type: String, required: true, index: true },
    betAmount: { type: Number, required: true },
    showBalance: { type: Boolean, required: true, default: false },
    skipAnimations: { type: Boolean, required: true, default: false },

    idleNudgeSentAt: { type: Date, default: null }
  },
  { timestamps: true }
)

BaccaratGameSchema.index({ userId: 1, guildId: 1 }, { unique: true })
