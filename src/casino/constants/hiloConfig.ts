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

export type HiloGuess = 'higher' | 'lower' | 'same'
export type HiloRoundOutcome = 'win' | 'lose'

export const hiloRankFromLabel = (label: string): number => {
  const index = (HILO_LABELS as readonly string[]).indexOf(label)
  if (index === -1) throw new Error(`Unknown Hi-Lo card label: ${label}`)
  return index + HILO_RANK_MIN
}

/**
 * Total payout multiplier (includes stake) for a win on `guess` given `first`.
 * Single 52-card deck, no replacement. Every remaining card is decisive:
 * - higher / lower: same rank is a loss (Draw is its own bet)
 * - same: next card matches rank (3 of 51 left)
 */
export const getHiloWinMultiplier = (
  first: number,
  guess: HiloGuess,
  houseEdge: number
): number | null => {
  const remaining = HILO_DECK_SIZE - 1

  if (guess === 'same') {
    const favorableCards = HILO_SUITS_PER_RANK - 1
    return ((1 - houseEdge) * remaining) / favorableCards
  }

  const favorableRanks =
    guess === 'higher' ? HILO_RANK_MAX - first : first - HILO_RANK_MIN
  const favorableCards = favorableRanks * HILO_SUITS_PER_RANK
  if (favorableCards <= 0) return null

  return ((1 - houseEdge) * remaining) / favorableCards
}

export const resolveHiloRound = (
  first: number,
  second: number,
  guess: HiloGuess
): HiloRoundOutcome => {
  if (guess === 'same') return second === first ? 'win' : 'lose'
  if (second === first) return 'lose'
  const wentHigher = second > first
  const correct =
    (guess === 'higher' && wentHigher) || (guess === 'lower' && !wentHigher)
  return correct ? 'win' : 'lose'
}

/** Expected return % when every remaining card settles the bet. */
export const calculateHiloRtp = (houseEdge: number): number =>
  (1 - houseEdge) * 100

const HILO_GUESSES: readonly HiloGuess[] = ['higher', 'lower', 'same']

/**
 * Guess with the lowest win multiplier (most likely / safest side).
 * Used when a waiting round times out so the stake is played instead of forfeited.
 * Always returns a guess - `same` is always available.
 */
export const pickSafestHiloGuess = (
  first: number,
  houseEdge: number
): HiloGuess => {
  let best: HiloGuess = 'same'
  let bestMult = Number.POSITIVE_INFINITY

  for (const guess of HILO_GUESSES) {
    const mult = getHiloWinMultiplier(first, guess, houseEdge)
    if (mult == null) continue
    if (mult < bestMult) {
      bestMult = mult
      best = guess
    }
  }

  return best
}
