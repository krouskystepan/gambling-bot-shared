import { Schema } from 'mongoose'

import { TAtmRequest } from './types/atmRequest'

export const AtmRequestSchema = new Schema<TAtmRequest>(
  {
    requestId: { type: String, required: true, unique: true },
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },

    type: { type: String, enum: ['deposit', 'withdraw'], required: true },
    amount: { type: Number, required: true, min: 1 },
    account: { type: String, required: true },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      required: true,
      default: 'pending',
      index: true
    },
    handledBy: { type: String },
    handledAt: { type: Date },
    notes: { type: String },

    logChannelId: { type: String },
    logMessageId: { type: String },

    meta: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
)

AtmRequestSchema.index({ guildId: 1, status: 1, createdAt: -1 })
