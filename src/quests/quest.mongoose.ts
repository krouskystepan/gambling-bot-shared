import { Schema } from 'mongoose'

import { CASINO_GAME_IDS } from '../casino/constants/casinoGames'
import { QUEST_CONDITION_TYPES, QUEST_KINDS } from './constants/questLimits'
import { TQuest } from './types/quest'

export const QuestSchema = new Schema<TQuest>(
  {
    questId: { type: String, required: true },
    guildId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    kind: {
      type: String,
      enum: QUEST_KINDS,
      required: true,
      index: true
    },
    condition: {
      type: {
        type: String,
        enum: QUEST_CONDITION_TYPES,
        required: true
      },
      threshold: { type: Number, required: true },
      game: {
        type: String,
        enum: CASINO_GAME_IDS,
        required: false
      }
    },
    rewardAmount: { type: Number, required: true, default: 0 },
    enabled: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
)

QuestSchema.index({ questId: 1, guildId: 1 }, { unique: true })
QuestSchema.index({ guildId: 1, enabled: 1, kind: 1, sortOrder: 1 })
