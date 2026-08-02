export const SUITES = ['♠️', '♣️', '♥️', '♦️'] as const
export const VALUES = [
  { label: 'A', value: 11 },
  { label: '2', value: 2 },
  { label: '3', value: 3 },
  { label: '4', value: 4 },
  { label: '5', value: 5 },
  { label: '6', value: 6 },
  { label: '7', value: 7 },
  { label: '8', value: 8 },
  { label: '9', value: 9 },
  { label: '10', value: 10 },
  { label: 'J', value: 10 },
  { label: 'Q', value: 10 },
  { label: 'K', value: 10 }
] as const

/**
 * Multi-deck shoe only (no single-deck). Matches standard Perfect Pairs /
 * insurance table rules: 2-8 decks.
 */
export const BLACKJACK_DECK_MIN = 2
export const BLACKJACK_DECK_MAX = 8
export const BLACKJACK_DECK_DEFAULT = 2

/** Clamp/coerce guild `deckCount` into the allowed shoe range. */
export const normalizeBlackjackDeckCount = (value: unknown): number => {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return BLACKJACK_DECK_DEFAULT
  return Math.min(
    BLACKJACK_DECK_MAX,
    Math.max(BLACKJACK_DECK_MIN, Math.round(n))
  )
}

/**
 * Approximate hand-outcome weights for RTP display (basic-strategy multi-deck S17).
 * Calibrated so default multipliers (win 2 / blackjack 2.5 / push 1) yield ~99.5% RTP.
 * Ignores double/split stake scaling; used only for admin settings feedback.
 */
export const BLACKJACK_OUTCOME_PROBS = {
  win: 0.3986,
  blackjack: 0.0452,
  push: 0.0848,
  loss: 0.4714
} as const

/**
 * P(dealer has blackjack | Ace showing) on a fresh d-deck shoe.
 * Tens remaining / cards remaining after the upcard Ace is removed.
 */
export const blackjackInsuranceDealerBjProb = (deckCount: unknown): number => {
  const decks = normalizeBlackjackDeckCount(deckCount)
  return (16 * decks) / (52 * decks - 1)
}

/** Insurance RTP (%) from total-return multiplier and shoe size. */
export const calculateBlackjackInsuranceRtp = (
  deckCount: unknown,
  insuranceMultiplier: unknown
): number => {
  const n =
    typeof insuranceMultiplier === 'number'
      ? insuranceMultiplier
      : Number(insuranceMultiplier)
  if (!Number.isFinite(n) || n <= 0) return 0
  return blackjackInsuranceDealerBjProb(deckCount) * n * 100
}

const combination2 = (n: number): number => (n * (n - 1)) / 2

/**
 * Exact Perfect Pairs RTP (%) for the player's first two cards from a d-deck shoe.
 * Multipliers are total-return (stake included); loss contributes 0.
 */
export const calculateBlackjackPairsRtp = (
  deckCount: unknown,
  pairsMultipliers: {
    perfect?: unknown
    colored?: unknown
    mixed?: unknown
  }
): number => {
  const decks = normalizeBlackjackDeckCount(deckCount)
  const toNumber = (value: unknown): number => {
    const n = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(n) ? n : 0
  }

  const total = combination2(52 * decks)
  const sameSuitPair = combination2(decks) // C(d,2) copies of one exact card
  const perfect = 52 * sameSuitPair

  // Per rank: 4 suits × d copies. Colored = same color, different suits.
  const sameRank = combination2(4 * decks)
  const perfectPerRank = 4 * sameSuitPair
  const coloredPerRank = 2 * (combination2(2 * decks) - 2 * sameSuitPair)
  const mixedPerRank = sameRank - perfectPerRank - coloredPerRank

  const colored = 13 * coloredPerRank
  const mixed = 13 * mixedPerRank

  return (
    ((perfect / total) * toNumber(pairsMultipliers.perfect) +
      (colored / total) * toNumber(pairsMultipliers.colored) +
      (mixed / total) * toNumber(pairsMultipliers.mixed)) *
    100
  )
}
