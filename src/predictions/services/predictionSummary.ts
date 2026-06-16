import type { TPrediction } from '../types/prediction'

export function resolvePredictionBetId(
  bet: TPrediction['choices'][number]['bets'][number],
  predictionId: string
) {
  return bet.betId ?? `${predictionId}:${bet.userId}`
}

export type PredictionChoiceSummary = {
  choiceName: string
  odds: number
  betCount: number
  totalBetAmount: number
  payoutIfWins: number
  bets: TPrediction['choices'][number]['bets']
}

export type PredictionCheckSummary = {
  totalBetAmount: number
  bettorCount: number
  choices: PredictionChoiceSummary[]
}

export function getPredictionCheckSummary(
  prediction: TPrediction
): PredictionCheckSummary {
  const allBets = prediction.choices.flatMap((c) => c.bets)
  const bettorCount = new Set(allBets.map((b) => b.userId)).size
  const totalBetAmount = allBets.reduce((acc, b) => acc + b.amount, 0)

  const choices = prediction.choices.map((choice) => {
    const totalBet = choice.bets.reduce((acc, b) => acc + b.amount, 0)
    const payoutIfWins = choice.bets.reduce(
      (acc, b) => acc + b.amount * choice.odds,
      0
    )

    return {
      choiceName: choice.choiceName,
      odds: choice.odds,
      betCount: choice.bets.length,
      totalBetAmount: totalBet,
      payoutIfWins,
      bets: choice.bets
    }
  })

  return {
    totalBetAmount,
    bettorCount,
    choices
  }
}

export type PayoutBetSummary = {
  userId: string
  betAmount: number
  winAmount: number
}

export type PredictionPayoutSummary = {
  participants: number
  winners: PayoutBetSummary[]
  losers: PayoutBetSummary[]
  totalWon: number
  totalLost: number
  casinoProfit: number
}

export function calculatePredictionPayoutSummary(
  prediction: TPrediction,
  winnerChoice: string
): PredictionPayoutSummary | null {
  const winner = prediction.choices.find((c) => c.choiceName === winnerChoice)
  if (!winner) return null

  const totalBets = prediction.choices.flatMap((c) => c.bets)

  const winners = winner.bets.map((b) => ({
    userId: b.userId,
    betAmount: b.amount,
    winAmount: b.amount * winner.odds
  }))

  const losers = prediction.choices
    .filter((c) => c.choiceName !== winnerChoice)
    .flatMap((c) =>
      c.bets.map((b) => ({
        userId: b.userId,
        betAmount: b.amount,
        winAmount: 0
      }))
    )

  const totalWon = winners.reduce((acc, w) => acc + w.winAmount, 0)
  const totalLost = losers.reduce((acc, l) => acc + l.betAmount, 0)

  return {
    participants: totalBets.length,
    winners,
    losers,
    totalWon,
    totalLost,
    casinoProfit: totalLost - totalWon
  }
}
