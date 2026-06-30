import { Schema } from 'mongoose'

import { TUser } from './types/user'

const UserStaffNoteSchema = new Schema(
  {
    noteId: { type: String, required: true },
    text: { type: String, required: true },
    authorId: { type: String, required: true },
    createdAt: { type: Date, required: true }
  },
  { _id: false }
)

export const UserSchema = new Schema<TUser>(
  {
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    balance: { type: Number, default: 0 }, // CASH (withdrawable)
    bonusBalance: { type: Number, default: 0 }, // BONUS (non-withdrawable)
    lockedBalance: { type: Number, default: 0 }, // ONLY for in-flight bets
    lastDailyClaim: { type: Date, default: null },
    dailyStreak: { type: Number, default: 0 },
    banned: { type: Boolean, default: false },
    bannedAt: { type: Date, default: null },
    bannedBy: { type: String, default: null },
    staffNotes: { type: [UserStaffNoteSchema], default: [] }
  },
  { timestamps: true }
)

UserSchema.index({ userId: 1, guildId: 1 }, { unique: true })
