import { Schema } from 'mongoose'

import { TMinesGame } from './types/minesGame'

export const MinesGameSchema = new Schema<TMinesGame>(
  {
    userId: { type: String, required: true, index: true },
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, required: true },
    messageId: { type: String, required: true },
    betId: { type: String, required: true, index: true },

    betAmount: { type: Number, required: true },
    mineCount: { type: Number, required: true },
    mineIndices: { type: [Number], required: true, default: [] },
    revealedIndices: { type: [Number], required: true, default: [] },
    houseEdgeSnapshot: { type: Number, required: true },

    status: {
      type: String,
      enum: ['ACTIVE', 'FINISHED'],
      required: true,
      default: 'ACTIVE'
    },

    idleNudgeSentAt: { type: Date, default: null }
  },
  { timestamps: true }
)

MinesGameSchema.index({ userId: 1, guildId: 1 }, { unique: true })
