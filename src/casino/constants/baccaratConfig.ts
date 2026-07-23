/** Baccarat card with shared suit/rank labels (blackjack `SUITES` / `VALUES`). */
export type BaccaratCard = {
  label: string
  suite: string
}

export type BaccaratOutcome = 'player' | 'banker' | 'tie'

export type BaccaratBetSide =
  | 'player'
  | 'banker'
  | 'tie'
  | 'playerPair'
  | 'bankerPair'

export const BACCARAT_BET_SIDES = [
  'player',
  'banker',
  'tie',
  'playerPair',
  'bankerPair'
] as const satisfies readonly BaccaratBetSide[]

export const BACCARAT_DECK_COUNT = 8

/**
 * Well-known absolute 8-deck punto banco probabilities.
 * Player / banker / tie sum to 1. Pair probs are independent of the main outcome.
 * Sources: standard 8-deck shoe tables (Wizard of Odds / published combinatorics).
 */
export const BACCARAT_8_DECK_PROBS = {
  player: 0.446_246_625_920_722,
  banker: 0.458_597_428_731_006,
  tie: 0.095_155_945_348_272,
  playerPair: 0.074_751_778,
  bankerPair: 0.074_751_778
} as const

/** Face values for baccarat (modulo-10 hand totals). */
export const baccaratCardValue = (label: string): number => {
  if (label === 'A') return 1
  if (label === '10' || label === 'J' || label === 'Q' || label === 'K') {
    return 0
  }
  const n = Number(label)
  if (Number.isInteger(n) && n >= 2 && n <= 9) return n
  throw new Error(`Unknown baccarat card label: ${label}`)
}

export const handTotal = (cards: readonly BaccaratCard[]): number =>
  cards.reduce((sum, card) => sum + baccaratCardValue(card.label), 0) % 10

/** Pair = first two cards share the same rank label (suit ignored). */
export const isPair = (cards: readonly BaccaratCard[]): boolean =>
  cards.length >= 2 && cards[0]!.label === cards[1]!.label

/** Player draws a third card on totals 0–5 (naturals 8–9 never reach here). */
export const shouldPlayerDrawThird = (playerTotal: number): boolean =>
  playerTotal <= 5

/**
 * Full banker tableau.
 * When the player stands, banker draws on 0–5.
 * When the player drew third card value `playerThirdValue`, use the matrix.
 */
export const shouldBankerDrawThird = (
  bankerTotal: number,
  playerDrewThird: boolean,
  playerThirdValue = 0
): boolean => {
  if (!playerDrewThird) return bankerTotal <= 5

  if (bankerTotal <= 2) return true
  if (bankerTotal === 3) return playerThirdValue !== 8
  if (bankerTotal === 4) {
    return playerThirdValue >= 2 && playerThirdValue <= 7
  }
  if (bankerTotal === 5) {
    return playerThirdValue >= 4 && playerThirdValue <= 7
  }
  if (bankerTotal === 6) {
    return playerThirdValue === 6 || playerThirdValue === 7
  }
  return false
}

export type BaccaratRoundResult = {
  playerCards: BaccaratCard[]
  bankerCards: BaccaratCard[]
  outcome: BaccaratOutcome
  playerPair: boolean
  bankerPair: boolean
  playerTotal: number
  bankerTotal: number
}

/**
 * Deal one punto banco round.
 * `draw` must return the next card from a shuffled shoe (caller owns RNG).
 */
export const dealBaccaratRound = (
  draw: () => BaccaratCard
): BaccaratRoundResult => {
  const playerCards: BaccaratCard[] = [draw(), draw()]
  const bankerCards: BaccaratCard[] = [draw(), draw()]

  const playerPair = isPair(playerCards)
  const bankerPair = isPair(bankerCards)

  let playerTotal = handTotal(playerCards)
  let bankerTotal = handTotal(bankerCards)

  // Naturals: no third cards
  if (playerTotal < 8 && bankerTotal < 8) {
    let playerDrewThird = false
    let playerThirdValue = 0

    if (shouldPlayerDrawThird(playerTotal)) {
      const third = draw()
      playerCards.push(third)
      playerThirdValue = baccaratCardValue(third.label)
      playerTotal = handTotal(playerCards)
      playerDrewThird = true
    }

    if (shouldBankerDrawThird(bankerTotal, playerDrewThird, playerThirdValue)) {
      bankerCards.push(draw())
      bankerTotal = handTotal(bankerCards)
    }
  }

  const outcome: BaccaratOutcome =
    playerTotal > bankerTotal
      ? 'player'
      : bankerTotal > playerTotal
        ? 'banker'
        : 'tie'

  return {
    playerCards,
    bankerCards,
    outcome,
    playerPair,
    bankerPair,
    playerTotal,
    bankerTotal
  }
}

export type BaccaratBetResolution = {
  /** Total-return multiplier (1 = push / stake returned, 0 = lose). */
  multiplier: number
  won: boolean
  push: boolean
}

/**
 * Resolve a single-side bet against a dealt round.
 * Player/banker main bets push on tie (stake returned). Pair bets ignore outcome.
 */
export const resolveBaccaratBet = (
  side: BaccaratBetSide,
  round: Pick<BaccaratRoundResult, 'outcome' | 'playerPair' | 'bankerPair'>,
  winMultipliers: Record<BaccaratBetSide, number>
): BaccaratBetResolution => {
  if (side === 'playerPair') {
    const won = round.playerPair
    return {
      won,
      push: false,
      multiplier: won ? winMultipliers.playerPair : 0
    }
  }

  if (side === 'bankerPair') {
    const won = round.bankerPair
    return {
      won,
      push: false,
      multiplier: won ? winMultipliers.bankerPair : 0
    }
  }

  if (side === 'tie') {
    const won = round.outcome === 'tie'
    return {
      won,
      push: false,
      multiplier: won ? winMultipliers.tie : 0
    }
  }

  if (round.outcome === 'tie') {
    return { won: false, push: true, multiplier: 1 }
  }

  const won = round.outcome === side
  return {
    won,
    push: false,
    multiplier: won ? winMultipliers[side] : 0
  }
}

export const isValidBaccaratBetSide = (side: string): side is BaccaratBetSide =>
  (BACCARAT_BET_SIDES as readonly string[]).includes(side)
