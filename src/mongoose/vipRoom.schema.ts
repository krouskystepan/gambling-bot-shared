import { Schema } from 'mongoose'
import { TVipRoom } from '../types'

export const VipRoomSchema = new Schema<TVipRoom>(
  {
    ownerId: { type: String, required: true },
    guildId: { type: String, required: true },
    channelId: { type: String, required: true },
    memberIds: {
      type: [String],
      default: [],
    },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
)

VipRoomSchema.index({ expiresAt: 1 })
VipRoomSchema.index({ ownerId: 1, guildId: 1 }, { unique: true })
VipRoomSchema.index({ memberIds: 1 })
