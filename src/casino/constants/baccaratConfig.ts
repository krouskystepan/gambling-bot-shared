/** Baccarat card with shared suit/rank labels (blackjack `SUITES` / `VALUES`). */
export type BaccaratCard = {
  label: string
  suite: string
}

export type BaccaratOutcome = 'player' | 'banker' | 'tie'

export type BaccaratFlatBetSide =
  | 'player'
  | 'banker'
  | 'tie'
  | 'playerPair'
  | 'bankerPair'
  | 'eitherPair'
  | 'perfectPair'
  | 'big'
  | 'small'

export type BaccaratBetSide =
  | BaccaratFlatBetSide
  | 'playerDragonBonus'
  | 'bankerDragonBonus'
  | 'lucky6'

export const BACCARAT_FLAT_BET_SIDES = [
  'player',
  'banker',
  'tie',
  'playerPair',
  'bankerPair',
  'eitherPair',
  'perfectPair',
  'big',
  'small'
] as const satisfies readonly BaccaratFlatBetSide[]

export const BACCARAT_BET_SIDES = [
  ...BACCARAT_FLAT_BET_SIDES,
  'playerDragonBonus',
  'bankerDragonBonus',
  'lucky6'
] as const satisfies readonly BaccaratBetSide[]

export type BaccaratDragonBonusTier =
  | 'winBy9'
  | 'winBy8'
  | 'winBy7'
  | 'winBy6'
  | 'winBy5'
  | 'winBy4'
  | 'naturalWin'

export type BaccaratLucky6Tier = 'twoCard' | 'threeCard'

export const BACCARAT_DRAGON_BONUS_TIERS = [
  'winBy9',
  'winBy8',
  'winBy7',
  'winBy6',
  'winBy5',
  'winBy4',
  'naturalWin'
] as const satisfies readonly BaccaratDragonBonusTier[]

export const BACCARAT_LUCKY6_TIERS = [
  'twoCard',
  'threeCard'
] as const satisfies readonly BaccaratLucky6Tier[]

export const BACCARAT_DECK_COUNT = 8

/**
 * Well-known absolute 8-deck punto banco probabilities.
 * Sources: Wizard of Odds / published combinatorics.
 */
export const BACCARAT_8_DECK_PROBS = {
  player: 0.446_246_625_920_722,
  banker: 0.458_597_428_731_006,
  tie: 0.095_155_945_348_272,
  playerPair: 0.074_751_778,
  bankerPair: 0.074_751_778,
  eitherPair: 0.143_817,
  perfectPair: 0.033_45,
  big: 0.621_131,
  small: 0.378_868,
  playerDragonBonus: {
    winBy9: 0.003_683,
    winBy8: 0.006_822,
    winBy7: 0.017_924,
    winBy6: 0.028_257,
    winBy5: 0.033_244,
    winBy4: 0.037_368,
    naturalWin: 0.162_589,
    naturalTie: 0.017_871
  },
  bankerDragonBonus: {
    winBy9: 0.003_079,
    winBy8: 0.005_663,
    winBy7: 0.015_909,
    winBy6: 0.023_848,
    winBy5: 0.031_465,
    winBy4: 0.040_242,
    naturalWin: 0.162_589,
    naturalTie: 0.017_871
  },
  lucky6: {
    twoCard: 0.037_247,
    threeCard: 0.016_617
  }
} as const

export type BaccaratWinMultipliers = Record<BaccaratFlatBetSide, number>
export type BaccaratDragonBonusMultipliers = Record<
  BaccaratDragonBonusTier,
  number
>
export type BaccaratLucky6Multipliers = Record<BaccaratLucky6Tier, number>

/** Payout tables used to resolve a slip (total-return multipliers). */
export type BaccaratPayoutConfig = {
  winMultipliers: BaccaratWinMultipliers
  dragonBonusMultipliers: BaccaratDragonBonusMultipliers
  lucky6Multipliers: BaccaratLucky6Multipliers
}

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

/** Perfect pair = first two cards share rank and suit. */
export const isPerfectPair = (cards: readonly BaccaratCard[]): boolean =>
  cards.length >= 2 &&
  cards[0]!.label === cards[1]!.label &&
  cards[0]!.suite === cards[1]!.suite

/** Natural = two-card total of 8 or 9. */
export const isNaturalHand = (
  cards: readonly BaccaratCard[],
  total: number
): boolean => cards.length === 2 && (total === 8 || total === 9)

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
  perfectPlayerPair: boolean
  perfectBankerPair: boolean
  cardCount: number
  playerTotal: number
  bankerTotal: number
}

/** Rebuild round flags from already-dealt hands (recovery / settle). */
export const baccaratRoundFromCards = (
  playerCards: BaccaratCard[],
  bankerCards: BaccaratCard[]
): BaccaratRoundResult => {
  const playerTotal = handTotal(playerCards)
  const bankerTotal = handTotal(bankerCards)

  return {
    playerCards,
    bankerCards,
    outcome:
      playerTotal > bankerTotal
        ? 'player'
        : bankerTotal > playerTotal
          ? 'banker'
          : 'tie',
    playerPair: isPair(playerCards),
    bankerPair: isPair(bankerCards),
    perfectPlayerPair: isPerfectPair(playerCards),
    perfectBankerPair: isPerfectPair(bankerCards),
    cardCount: playerCards.length + bankerCards.length,
    playerTotal,
    bankerTotal
  }
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

  return baccaratRoundFromCards(playerCards, bankerCards)
}

export type BaccaratBetResolution = {
  /** Total-return multiplier (1 = push / stake returned, 0 = lose). */
  multiplier: number
  won: boolean
  push: boolean
}

export type BaccaratRoundFlags = Pick<
  BaccaratRoundResult,
  | 'outcome'
  | 'playerPair'
  | 'bankerPair'
  | 'perfectPlayerPair'
  | 'perfectBankerPair'
  | 'cardCount'
  | 'playerTotal'
  | 'bankerTotal'
  | 'playerCards'
  | 'bankerCards'
>

const dragonMarginTier: Record<number, BaccaratDragonBonusTier> = {
  9: 'winBy9',
  8: 'winBy8',
  7: 'winBy7',
  6: 'winBy6',
  5: 'winBy5',
  4: 'winBy4'
}

const resolveDragonBonus = (
  side: 'player' | 'banker',
  round: BaccaratRoundFlags,
  multipliers: BaccaratDragonBonusMultipliers
): BaccaratBetResolution => {
  const ownCards = side === 'player' ? round.playerCards : round.bankerCards
  const ownTotal = side === 'player' ? round.playerTotal : round.bankerTotal
  const otherCards = side === 'player' ? round.bankerCards : round.playerCards
  const otherTotal = side === 'player' ? round.bankerTotal : round.playerTotal
  const ownNatural = isNaturalHand(ownCards, ownTotal)
  const otherNatural = isNaturalHand(otherCards, otherTotal)

  if (round.outcome === 'tie') {
    if (ownNatural && otherNatural) {
      return { won: false, push: true, multiplier: 1 }
    }
    return { won: false, push: false, multiplier: 0 }
  }

  if (round.outcome !== side) {
    return { won: false, push: false, multiplier: 0 }
  }

  if (ownNatural) {
    return {
      won: true,
      push: false,
      multiplier: multipliers.naturalWin
    }
  }

  const margin = ownTotal - otherTotal
  const tier = dragonMarginTier[margin]
  if (!tier) {
    // Win by 1–3 does not pay on the standard Dragon Bonus table.
    return { won: false, push: false, multiplier: 0 }
  }

  return {
    won: true,
    push: false,
    multiplier: multipliers[tier]
  }
}

/**
 * Resolve a single-side bet against a dealt round.
 * Player/banker main bets push on tie (stake returned). Pair / size bets ignore outcome.
 * Dragon Bonus / Lucky 6 use tiered payout tables.
 */
export const resolveBaccaratBet = (
  side: BaccaratBetSide,
  round: BaccaratRoundFlags,
  payouts: BaccaratPayoutConfig
): BaccaratBetResolution => {
  const { winMultipliers, dragonBonusMultipliers, lucky6Multipliers } = payouts

  if (side === 'playerDragonBonus') {
    return resolveDragonBonus('player', round, dragonBonusMultipliers)
  }

  if (side === 'bankerDragonBonus') {
    return resolveDragonBonus('banker', round, dragonBonusMultipliers)
  }

  if (side === 'lucky6') {
    if (round.outcome !== 'banker' || round.bankerTotal !== 6) {
      return { won: false, push: false, multiplier: 0 }
    }

    const multiplier =
      round.bankerCards.length === 2
        ? lucky6Multipliers.twoCard
        : lucky6Multipliers.threeCard

    return { won: true, push: false, multiplier }
  }

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

  if (side === 'eitherPair') {
    const won = round.playerPair || round.bankerPair
    return {
      won,
      push: false,
      multiplier: won ? winMultipliers.eitherPair : 0
    }
  }

  if (side === 'perfectPair') {
    const won = round.perfectPlayerPair || round.perfectBankerPair
    return {
      won,
      push: false,
      multiplier: won ? winMultipliers.perfectPair : 0
    }
  }

  if (side === 'big') {
    const won = round.cardCount === 5 || round.cardCount === 6
    return {
      won,
      push: false,
      multiplier: won ? winMultipliers.big : 0
    }
  }

  if (side === 'small') {
    const won = round.cardCount === 4
    return {
      won,
      push: false,
      multiplier: won ? winMultipliers.small : 0
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

export type BaccaratSlipBet = {
  side: BaccaratBetSide
  amount: number
}

export type BaccaratSlipLine = BaccaratSlipBet &
  BaccaratBetResolution & {
    winnings: number
  }

export type BaccaratSlipResolution = {
  lines: BaccaratSlipLine[]
  totalWinnings: number
}

/** Resolve every slip line and sum total-return payouts. */
export const resolveBaccaratSlip = (
  bets: readonly BaccaratSlipBet[],
  round: BaccaratRoundFlags,
  payouts: BaccaratPayoutConfig
): BaccaratSlipResolution => {
  const lines = bets.map((bet) => {
    const resolution = resolveBaccaratBet(bet.side, round, payouts)
    // Copy side/amount explicitly: mongoose subdocs do not spread with `...bet`.
    return {
      side: bet.side,
      amount: bet.amount,
      ...resolution,
      winnings: bet.amount * resolution.multiplier
    }
  })

  return {
    lines,
    totalWinnings: lines.reduce((sum, line) => sum + line.winnings, 0)
  }
}

export const isValidBaccaratBetSide = (side: string): side is BaccaratBetSide =>
  (BACCARAT_BET_SIDES as readonly string[]).includes(side)

export const isBaccaratFlatBetSide = (
  side: BaccaratBetSide
): side is BaccaratFlatBetSide =>
  (BACCARAT_FLAT_BET_SIDES as readonly string[]).includes(side)
