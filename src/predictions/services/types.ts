import type { TPrediction, TPredictionOption } from '../types/prediction'

export type TCreatePrediction = Omit<TPrediction, 'createdAt' | 'updatedAt'>

export type TGetPrediction = Pick<TPrediction, 'predictionId' | 'guildId'>

export type TGetOldPredictions = {
  statuses: TPrediction['status'][]
  olderThanDays: number
}

export type TUpdatePredictionStatus = Pick<
  TPrediction,
  'predictionId' | 'guildId'
> & {
  fromStatus: TPrediction['status'] | TPrediction['status'][]
  toStatus: TPrediction['status']
}

export type TAddPredictionBet = Pick<
  TPrediction,
  'predictionId' | 'guildId'
> & {
  choiceName: TPredictionOption['choiceName']
  userId: TPredictionOption['bets'][number]['userId']
  amount: TPredictionOption['bets'][number]['amount']
  betId: TPredictionOption['bets'][number]['betId']
}

export type PayPredictionResult =
  | {
      ok: true
      outcome: 'paid' | 'refunded'
      prediction: TPrediction
      winnerChoice?: string
    }
  | {
      ok: false
      code:
        | 'NOT_FOUND'
        | 'INVALID_STATUS'
        | 'ALREADY_HANDLED'
        | 'INVALID_WINNER'
    }

export type PredictionLifecycleErrorCode =
  | 'NOT_FOUND'
  | 'INVALID_STATUS'
  | 'ALREADY_HANDLED'
