import { Schema } from 'mongoose'

import { TUserQuestProgress } from './types/quest'

export const UserQuestProgressSchema = new Schema<TUserQuestProgress>(
  {
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    questId: { type: String, required: true },
    dateKey: { type: String, default: null },
    progress: { type: Number, default: 0 },
    completedAt: { type: Date, default: null },
    rewardedAt: { type: Date, default: null }
  },
  { timestamps: true }
)

UserQuestProgressSchema.index(
  { guildId: 1, userId: 1, questId: 1, dateKey: 1 },
  { unique: true }
)
UserQuestProgressSchema.index({ guildId: 1, userId: 1, dateKey: 1 })
