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

export const HiloGameSchema = new Schema<THiloGame>(
  {
    userId: { type: String, required: true, index: true },
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, required: true },
    messageId: { type: String, required: true },
    gameId: { type: String, required: true, index: true },
    activeBetId: { type: String, required: true, index: true },

    betAmount: { type: Number, required: true },
    firstCard: { type: hiloCardSchema, required: true },
    remainingDeck: { type: [hiloCardSchema], required: true, default: [] },
    houseEdgeSnapshot: { type: Number, required: true },
    timeoutFeeSnapshot: { type: Number, required: true },
    showBalance: { type: Boolean, required: true, default: false },

    status: {
      type: String,
      enum: ['WAITING', 'SETTLING'],
      required: true,
      default: 'WAITING'
    },

    idleNudgeSentAt: { type: Date, default: null }
  },
  { timestamps: true }
)

HiloGameSchema.index({ userId: 1, guildId: 1 }, { unique: true })
HiloGameSchema.index({ status: 1, createdAt: 1 })
