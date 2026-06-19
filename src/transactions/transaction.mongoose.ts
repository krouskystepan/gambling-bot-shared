import { Schema } from 'mongoose'

import { TTransaction } from './types/transaction'

export const TransactionSchema = new Schema<TTransaction>(
  {
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    amount: { type: Number, required: true },
    type: {
      type: String,
      required: true,
      enum: ['deposit', 'withdraw', 'bet', 'win', 'refund', 'bonus', 'vip']
    },
    source: {
      type: String,
      required: true,
      enum: ['command', 'manual', 'web', 'system', 'casino']
    },
    meta: { type: Schema.Types.Mixed, default: {} },
    referenceId: { type: String, default: null },
    handledBy: { type: String, default: null }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

TransactionSchema.index(
  { referenceId: 1, type: 1 },
  {
    unique: true,
    partialFilterExpression: {
      referenceId: { $exists: true, $ne: null }
    }
  }
)

// for pagination / sorting
TransactionSchema.index({ guildId: 1, createdAt: -1 })
// filter + sort
TransactionSchema.index({ guildId: 1, type: 1, createdAt: -1 })
// filter + sort
TransactionSchema.index({ guildId: 1, source: 1, createdAt: -1 })
// user search
TransactionSchema.index({ guildId: 1, userId: 1, createdAt: -1 })
// admin search
TransactionSchema.index({ guildId: 1, handledBy: 1, createdAt: -1 })
// reference ID lookups
TransactionSchema.index({ guildId: 1, referenceId: 1 })
