import { Schema } from 'mongoose'
import { TPrediction } from '../types'

const PredictionSchema = new Schema<TPrediction>(
  {
    predictionId: {
      type: String,
      required: true,
    },
    guildId: {
      type: String,
      required: true,
    },
    channelId: {
      type: String,
      required: true,
    },
    creatorId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    choices: [
      {
        choiceName: { type: String, required: true },
        odds: { type: Number, required: true },
        bets: [
          {
            userId: { type: String, required: true },
            amount: { type: Number, required: true },
          },
        ],
      },
    ],
    status: {
      type: String,
      enum: ['active', 'ended', 'paid', 'canceled'],
      default: 'active',
    },
    autolock: {
      type: Date,
      required: false,
      default: null,
    },
  },
  { timestamps: true }
)

PredictionSchema.index({ predictionId: 1, guildId: 1 }, { unique: true })
