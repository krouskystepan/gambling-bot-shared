import { Schema } from 'mongoose'

import { TUserBan } from './types/userBan'

export const UserBanSchema = new Schema<TUserBan>(
  {
    banId: { type: String, required: true },
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    bannedAt: { type: Date, required: true },
    bannedBy: { type: String, required: true },
    banReason: { type: String },
    unbannedAt: { type: Date, default: null },
    unbannedBy: { type: String, default: null },
    unbanReason: { type: String }
  },
  { timestamps: true }
)

UserBanSchema.index({ banId: 1, guildId: 1 }, { unique: true })
UserBanSchema.index({ guildId: 1, userId: 1, bannedAt: -1 })
UserBanSchema.index({ guildId: 1, userId: 1, unbannedAt: 1 })
