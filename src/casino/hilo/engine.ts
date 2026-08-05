import {
  type HiloGuess,
  getHiloWinMultiplier,
  pickSafestHiloGuess,
  resolveHiloRound
} from '../constants/hiloConfig'
import type {
  HiloGameStatus,
  HiloStoredCard,
  THiloGame
} from '../types/hiloGame'

export type HiloEngineState = {
  betAmount: number
  firstCard: HiloStoredCard
  remainingDeck: HiloStoredCard[]
  currentMultiplier: number
  streak: number
  houseEdgeSnapshot: number
  status: Exclude<HiloGameStatus, 'BETTING' | 'SETTLING'>
}

export type HiloApplyGuessResult =
  | {
      kind: 'CONTINUE'
      guess: HiloGuess
      revealed: HiloStoredCard
      stepMultiplier: number
      currentMultiplier: number
      streak: number
    }
  | {
      kind: 'DECK_EMPTY_CASHOUT'
      guess: HiloGuess
      revealed: HiloStoredCard
      stepMultiplier: number
      currentMultiplier: number
      streak: number
      payout: number
      status: 'RESULT'
    }
  | {
      kind: 'BUST'
      guess: HiloGuess
      revealed: HiloStoredCard
      stepMultiplier: number
      payout: 0
      status: 'RESULT'
    }
  | {
      kind: 'IMPOSSIBLE'
      reason: 'NO_FAVORABLE'
    }
  | {
      kind: 'IGNORED'
      reason: 'RESULT' | 'EMPTY_DECK'
    }

export type HiloCashOutResult =
  | {
      kind: 'OK'
      multiplier: number
      payout: number
      streak: number
      status: 'RESULT'
    }
  | {
      kind: 'IGNORED'
      reason: 'RESULT' | 'NO_STREAK'
    }

export type HiloIdleResolution =
  | {
      kind: 'CASH_OUT'
      multiplier: number
      payout: number
      streak: number
    }
  | {
      kind: 'AUTO_GUESS'
      guess: HiloGuess
    }

export const createHiloEngine = (params: {
  betAmount: number
  firstCard: HiloStoredCard
  remainingDeck: HiloStoredCard[]
  houseEdgeSnapshot: number
  currentMultiplier?: number
  streak?: number
}): HiloEngineState => ({
  betAmount: params.betAmount,
  firstCard: params.firstCard,
  remainingDeck: params.remainingDeck.map((card) => ({ ...card })),
  currentMultiplier: params.currentMultiplier ?? 1,
  streak: params.streak ?? 0,
  houseEdgeSnapshot: params.houseEdgeSnapshot,
  status: 'WAITING'
})

export const docToHiloEngine = (
  doc: Pick<
    THiloGame,
    | 'betAmount'
    | 'firstCard'
    | 'remainingDeck'
    | 'currentMultiplier'
    | 'streak'
    | 'houseEdgeSnapshot'
    | 'status'
  >
): HiloEngineState => {
  if (
    doc.status === 'BETTING' ||
    doc.betAmount == null ||
    doc.firstCard == null
  ) {
    throw new Error('Hi-Lo engine requires an active or settled round')
  }

  return {
    betAmount: doc.betAmount,
    firstCard: {
      label: doc.firstCard.label,
      suite: doc.firstCard.suite,
      rank: doc.firstCard.rank
    },
    remainingDeck: doc.remainingDeck.map((card) => ({
      label: card.label,
      suite: card.suite,
      rank: card.rank
    })),
    currentMultiplier: doc.currentMultiplier ?? 1,
    streak: doc.streak ?? 0,
    houseEdgeSnapshot: doc.houseEdgeSnapshot,
    status: doc.status === 'SETTLING' ? 'WAITING' : doc.status
  }
}

export const cashOutHiloPayout = (
  state: HiloEngineState
): HiloCashOutResult => {
  if (state.status !== 'WAITING') {
    return { kind: 'IGNORED', reason: 'RESULT' }
  }

  if (state.streak < 1) {
    return { kind: 'IGNORED', reason: 'NO_STREAK' }
  }

  const multiplier = state.currentMultiplier
  const payout = state.betAmount * multiplier
  state.status = 'RESULT'

  return {
    kind: 'OK',
    multiplier,
    payout,
    streak: state.streak,
    status: 'RESULT'
  }
}

/**
 * Apply one guess against the next card (popped from the remaining deck).
 * Correct guesses compound `currentMultiplier` and continue unless the deck
 * is empty (forced cash-out). Wrong guesses bust to 0.
 */
export const applyHiloGuess = (
  state: HiloEngineState,
  guess: HiloGuess
): HiloApplyGuessResult => {
  if (state.status !== 'WAITING') {
    return { kind: 'IGNORED', reason: 'RESULT' }
  }

  if (state.remainingDeck.length < 1) {
    return { kind: 'IGNORED', reason: 'EMPTY_DECK' }
  }

  const stepMultiplier = getHiloWinMultiplier(
    state.firstCard.rank,
    guess,
    state.houseEdgeSnapshot,
    state.remainingDeck
  )

  if (stepMultiplier == null) {
    return { kind: 'IMPOSSIBLE', reason: 'NO_FAVORABLE' }
  }

  const revealed = state.remainingDeck[state.remainingDeck.length - 1]!
  state.remainingDeck = state.remainingDeck.slice(0, -1)

  const outcome = resolveHiloRound(state.firstCard.rank, revealed.rank, guess)

  if (outcome === 'lose') {
    state.status = 'RESULT'
    return {
      kind: 'BUST',
      guess,
      revealed,
      stepMultiplier,
      payout: 0,
      status: 'RESULT'
    }
  }

  state.currentMultiplier *= stepMultiplier
  state.streak += 1
  state.firstCard = { ...revealed }

  if (state.remainingDeck.length < 1) {
    const payout = state.betAmount * state.currentMultiplier
    state.status = 'RESULT'
    return {
      kind: 'DECK_EMPTY_CASHOUT',
      guess,
      revealed,
      stepMultiplier,
      currentMultiplier: state.currentMultiplier,
      streak: state.streak,
      payout,
      status: 'RESULT'
    }
  }

  return {
    kind: 'CONTINUE',
    guess,
    revealed,
    stepMultiplier,
    currentMultiplier: state.currentMultiplier,
    streak: state.streak
  }
}

/** Cash out if streak ≥ 1, else pick the safest auto-guess for the first decision. */
export const resolveIdleHilo = (state: HiloEngineState): HiloIdleResolution => {
  if (state.status !== 'WAITING') {
    return {
      kind: 'AUTO_GUESS',
      guess: pickSafestHiloGuess(
        state.firstCard.rank,
        state.houseEdgeSnapshot,
        state.remainingDeck
      )
    }
  }

  if (state.streak >= 1) {
    const multiplier = state.currentMultiplier
    const payout = state.betAmount * multiplier
    state.status = 'RESULT'
    return {
      kind: 'CASH_OUT',
      multiplier,
      payout,
      streak: state.streak
    }
  }

  return {
    kind: 'AUTO_GUESS',
    guess: pickSafestHiloGuess(
      state.firstCard.rank,
      state.houseEdgeSnapshot,
      state.remainingDeck
    )
  }
}
