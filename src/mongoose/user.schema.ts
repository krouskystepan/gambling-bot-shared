import { Schema } from 'mongoose'
import { TUser } from '../types'

export const UserSchema = new Schema<TUser>(
  {
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    balance: { type: Number, default: 0 }, // CASH (withdrawable)
    bonusBalance: { type: Number, default: 0 }, // BONUS (non-withdrawable)
    lockedBalance: { type: Number, default: 0 }, // ONLY for in-flight bets
    lastDailyClaim: { type: Date, default: null },
    dailyStreak: { type: Number, default: 0 }
  },
  { timestamps: true }
)

UserSchema.index({ userId: 1, guildId: 1 }, { unique: true })
