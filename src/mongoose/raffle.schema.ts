import { Schema } from 'mongoose'

import { TRaffle } from '../types'

export const RaffleSchema = new Schema<TRaffle>(
  {
    drawId: { type: String, required: true },
    raffleId: { type: String, required: true },
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, required: true },
    creatorId: { type: String, required: true },

    ticketPrice: { type: Number, required: true, min: 1 },
    maxTicketsPerUser: { type: Number, required: true, min: 1 },

    nextDrawAt: { type: Date, required: true },
    lastDrawAt: { type: Date },
    drawIntervalMs: { type: Number, required: true, min: 1 },

    status: {
      type: String,
      enum: ['active', 'canceled'],
      default: 'active',
      index: true
    },

    participants: [
      {
        userId: { type: String, required: true },
        tickets: { type: Number, required: true, min: 1 }
      }
    ]
  },
  { timestamps: true }
)

RaffleSchema.index({ raffleId: 1 }, { unique: true })
