import type { Model } from 'mongoose'

import type { TPrediction } from '../types/prediction'
import type {
  TAddPredictionBet,
  TCreatePrediction,
  TGetOldPredictions,
  TGetPrediction,
  TUpdatePredictionStatus
} from './types'

export function createPredictionDb(predictionModel: Model<TPrediction>) {
  const getPredictionById = async ({
    predictionId,
    guildId
  }: TGetPrediction) => {
    return predictionModel.findOne({ predictionId, guildId })
  }

  const getPredictionToLock = async ({
    status = 'active',
    useAutolock = true
  }: {
    status?: TPrediction['status']
    useAutolock?: boolean
  }) => {
    const now = new Date()

    return predictionModel.find({
      status,
      ...(useAutolock ? { autolock: { $lte: now } } : {})
    })
  }

  const getOldPredictions = async ({
    statuses,
    olderThanDays
  }: TGetOldPredictions) => {
    const cutoffDate = new Date(
      Date.now() - olderThanDays * 24 * 60 * 60 * 1000
    )

    return predictionModel.find({
      status: { $in: statuses },
      updatedAt: { $lte: cutoffDate }
    })
  }

  const createPrediction = async ({
    predictionId,
    guildId,
    channelId,
    creatorId,
    title,
    choices,
    autolock,
    status
  }: TCreatePrediction) => {
    await predictionModel.create({
      predictionId,
      guildId,
      channelId,
      creatorId,
      title,
      choices,
      autolock,
      status
    })
  }

  const updatePredictionStatus = async ({
    predictionId,
    guildId,
    fromStatus,
    toStatus
  }: TUpdatePredictionStatus) => {
    return predictionModel.findOneAndUpdate(
      {
        predictionId,
        guildId,
        status: Array.isArray(fromStatus) ? { $in: fromStatus } : fromStatus
      },
      { $set: { status: toStatus } },
      { returnDocument: 'after' }
    )
  }

  const deletePrediction = async ({
    predictionId
  }: {
    predictionId: string
  }) => {
    await predictionModel.deleteOne({ predictionId })
  }

  const findPredictions = async (query: Record<string, unknown>) => {
    return predictionModel.find(query).limit(25)
  }

  const addPredictionBet = async ({
    predictionId,
    guildId,
    choiceName,
    userId,
    amount,
    betId
  }: TAddPredictionBet) => {
    return predictionModel.findOneAndUpdate(
      {
        predictionId,
        guildId,
        'choices.choiceName': choiceName
      },
      {
        $push: {
          'choices.$.bets': {
            userId,
            amount,
            betId
          }
        }
      }
    )
  }

  return {
    getPredictionById,
    getPredictionToLock,
    getOldPredictions,
    createPrediction,
    updatePredictionStatus,
    deletePrediction,
    findPredictions,
    addPredictionBet
  }
}

export type PredictionDb = ReturnType<typeof createPredictionDb>
