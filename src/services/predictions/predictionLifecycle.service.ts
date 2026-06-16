import type { TPrediction } from '../../types/prediction'
import type { CasinoBetService } from '../casino/casinoBet.service'
import type { PredictionDb } from './prediction.db'
import { resolvePredictionBetId } from './predictionSummary'
import type { PayPredictionResult } from './types'

type PredictionLifecycleDeps = {
  predictionDb: PredictionDb
  casinoBet: Pick<CasinoBetService, 'refundLockedBet' | 'settleCasinoWinnings'>
}

export function createPredictionLifecycleService({
  predictionDb,
  casinoBet
}: PredictionLifecycleDeps) {
  const { getPredictionById, updatePredictionStatus } = predictionDb
  const { refundLockedBet, settleCasinoWinnings } = casinoBet

  const finalizePaid = async (predictionId: string, guildId: string) => {
    const paid = await updatePredictionStatus({
      predictionId,
      guildId,
      fromStatus: 'paying',
      toStatus: 'paid'
    })

    if (!paid) throw new Error('FINALIZE_FAILED')

    return paid
  }

  const rollbackPaying = async (predictionId: string, guildId: string) => {
    await updatePredictionStatus({
      predictionId,
      guildId,
      fromStatus: 'paying',
      toStatus: 'ended'
    })
  }

  const endPrediction = async ({
    predictionId,
    guildId
  }: {
    predictionId: string
    guildId: string
  }): Promise<TPrediction | null> => {
    return updatePredictionStatus({
      predictionId,
      guildId,
      fromStatus: 'active',
      toStatus: 'ended'
    })
  }

  const cancelPrediction = async ({
    predictionId,
    guildId
  }: {
    predictionId: string
    guildId: string
  }): Promise<TPrediction | null> => {
    const updatedPrediction = await updatePredictionStatus({
      predictionId,
      guildId,
      fromStatus: ['active', 'ended'],
      toStatus: 'canceled'
    })

    if (!updatedPrediction) return null

    const allBets = updatedPrediction.choices.flatMap((c) => c.bets)
    for (const bet of allBets) {
      await refundLockedBet({
        userId: bet.userId,
        guildId,
        amount: bet.amount,
        betId: resolvePredictionBetId(bet, predictionId),
        game: 'prediction'
      })
    }

    return updatedPrediction
  }

  const payoutPrediction = async ({
    predictionId,
    guildId,
    winnerChoice
  }: {
    predictionId: string
    guildId: string
    winnerChoice: string
  }): Promise<PayPredictionResult> => {
    const prediction = await getPredictionById({ predictionId, guildId })
    if (!prediction) return { ok: false, code: 'NOT_FOUND' }

    if (prediction.status !== 'ended') {
      if (prediction.status === 'paid' || prediction.status === 'paying') {
        return { ok: false, code: 'ALREADY_HANDLED' }
      }

      return { ok: false, code: 'INVALID_STATUS' }
    }

    const winner = prediction.choices.find((c) => c.choiceName === winnerChoice)
    if (!winner) return { ok: false, code: 'INVALID_WINNER' }

    const locked = await updatePredictionStatus({
      predictionId,
      guildId,
      fromStatus: 'ended',
      toStatus: 'paying'
    })

    if (!locked) return { ok: false, code: 'ALREADY_HANDLED' }

    try {
      const allBets = prediction.choices.flatMap((c) => c.bets)

      if (winner.bets.length === 0) {
        for (const bet of allBets) {
          await refundLockedBet({
            userId: bet.userId,
            guildId,
            amount: bet.amount,
            betId: resolvePredictionBetId(bet, predictionId),
            game: 'prediction'
          })
        }

        const paid = await finalizePaid(predictionId, guildId)
        return { ok: true, outcome: 'refunded', prediction: paid }
      }

      for (const bet of winner.bets) {
        await settleCasinoWinnings({
          userId: bet.userId,
          guildId,
          totalBet: bet.amount,
          winnings: bet.amount * winner.odds,
          betId: resolvePredictionBetId(bet, predictionId),
          game: 'prediction'
        })
      }

      const losingChoices = prediction.choices.filter(
        (c) => c.choiceName !== winnerChoice
      )

      for (const choice of losingChoices) {
        for (const bet of choice.bets) {
          await settleCasinoWinnings({
            userId: bet.userId,
            guildId,
            totalBet: bet.amount,
            winnings: 0,
            betId: resolvePredictionBetId(bet, predictionId),
            game: 'prediction'
          })
        }
      }

      const paid = await finalizePaid(predictionId, guildId)
      return {
        ok: true,
        outcome: 'paid',
        prediction: paid,
        winnerChoice
      }
    } catch (error) {
      await rollbackPaying(predictionId, guildId)
      throw error
    }
  }

  return {
    endPrediction,
    cancelPrediction,
    payoutPrediction
  }
}

export type PredictionLifecycleService = ReturnType<
  typeof createPredictionLifecycleService
>
