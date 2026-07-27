import { Schema } from 'mongoose'

import { TBaccaratGame } from './types/baccaratGame'

const baccaratCardSchema = new Schema(
  {
    label: { type: String, required: true },
    suite: { type: String, required: true }
  },
  { _id: false }
)

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
    phase: {
      type: String,
      required: true,
      enum: ['waiting', 'dealing'],
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

    idleNudgeSentAt: { type: Date, default: null }
  },
  { timestamps: true }
)

BaccaratGameSchema.index({ userId: 1, guildId: 1 }, { unique: true })
