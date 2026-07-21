/** Ace-high ladder: 2 < … < 10 < J < Q < K < A. Rank = index + 2. */
export const HILO_LABELS = [
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
  'A'
] as const

export const HILO_RANK_MIN = 2
export const HILO_RANK_MAX = HILO_RANK_MIN + HILO_LABELS.length - 1
export const HILO_RANK_COUNT = HILO_LABELS.length
export const HILO_SUITS_PER_RANK = 4
export const HILO_DECK_SIZE = HILO_RANK_COUNT * HILO_SUITS_PER_RANK

export type HiloGuess = 'higher' | 'lower'
export type HiloRoundOutcome = 'win' | 'lose' | 'push'

export const hiloRankFromLabel = (label: string): number => {
  const index = (HILO_LABELS as readonly string[]).indexOf(label)
  if (index === -1) throw new Error(`Unknown Hi-Lo card label: ${label}`)
  return index + HILO_RANK_MIN
}

/**
 * Total payout multiplier (includes stake) for a win on `guess` given `first`.
 * Single 52-card deck, no replacement. Same-rank leftovers push (void).
 */
export const getHiloWinMultiplier = (
  first: number,
  guess: HiloGuess,
  houseEdge: number
): number | null => {
  const favorableRanks =
    guess === 'higher' ? HILO_RANK_MAX - first : first - HILO_RANK_MIN
  const favorableCards = favorableRanks * HILO_SUITS_PER_RANK
  if (favorableCards <= 0) return null

  const remaining = HILO_DECK_SIZE - 1
  const decisive = remaining - (HILO_SUITS_PER_RANK - 1)
  return ((1 - houseEdge) * decisive) / favorableCards
}

export const resolveHiloRound = (
  first: number,
  second: number,
  guess: HiloGuess
): HiloRoundOutcome => {
  if (second === first) return 'push'
  const wentHigher = second > first
  const correct =
    (guess === 'higher' && wentHigher) || (guess === 'lower' && !wentHigher)
  return correct ? 'win' : 'lose'
}

/** Expected return % (void same-rank pushes). */
export const calculateHiloRtp = (houseEdge: number): number => {
  const remaining = HILO_DECK_SIZE - 1
  const decisive = remaining - (HILO_SUITS_PER_RANK - 1)
  return (1 - houseEdge * (decisive / remaining)) * 100
}
