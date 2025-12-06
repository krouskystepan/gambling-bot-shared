import { Schema } from 'mongoose'
import { TVipRoom } from '../types'

export const VipRoomSchema = new Schema<TVipRoom>(
  {
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    channelId: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  {
    timestamps: true,
  }
)

VipRoomSchema.index({ expiresAt: 1 })
VipRoomSchema.index({ userId: 1, guildId: 1 }, { unique: true })
