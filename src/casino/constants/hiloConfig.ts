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

export type HiloRankCard = { rank: number }

export const hiloRankFromLabel = (label: string): number => {
  const index = (HILO_LABELS as readonly string[]).indexOf(label)
  if (index === -1) throw new Error(`Unknown Hi-Lo card label: ${label}`)
  return index + HILO_RANK_MIN
}

/**
 * Remaining cards after the first card of a full 52-card deck is dealt
 * (4 of every rank except 3 of the dealt rank).
 */
export const hiloFullDeckRemaining = (firstRank: number): HiloRankCard[] => {
  const cards: HiloRankCard[] = []
  for (let rank = HILO_RANK_MIN; rank <= HILO_RANK_MAX; rank++) {
    const count =
      rank === firstRank ? HILO_SUITS_PER_RANK - 1 : HILO_SUITS_PER_RANK
    for (let i = 0; i < count; i++) cards.push({ rank })
  }
  return cards
}

const countFavorable = (
  first: number,
  guess: HiloGuess,
  remainingCards: readonly HiloRankCard[]
): number => {
  if (guess === 'same') {
    return remainingCards.filter((card) => card.rank === first).length
  }
  if (guess === 'higher') {
    return remainingCards.filter((card) => card.rank > first).length
  }
  return remainingCards.filter((card) => card.rank < first).length
}

/**
 * Step payout multiplier (includes stake) for a win on `guess` given the
 * card-to-beat and the actual remaining deck (no replacement).
 * Every remaining card is decisive:
 * - higher / lower: same rank is a loss (Draw is its own bet)
 * - same: next card matches rank
 */
export const getHiloWinMultiplier = (
  first: number,
  guess: HiloGuess,
  houseEdge: number,
  remainingCards: readonly HiloRankCard[]
): number | null => {
  const remaining = remainingCards.length
  if (remaining <= 0) return null

  const favorableCards = countFavorable(first, guess, remainingCards)
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
 * Always returns a guess when at least one side is possible.
 */
export const pickSafestHiloGuess = (
  first: number,
  houseEdge: number,
  remainingCards: readonly HiloRankCard[]
): HiloGuess => {
  let best: HiloGuess = 'same'
  let bestMult = Number.POSITIVE_INFINITY

  for (const guess of HILO_GUESSES) {
    const mult = getHiloWinMultiplier(first, guess, houseEdge, remainingCards)
    if (mult == null) continue
    if (mult < bestMult) {
      bestMult = mult
      best = guess
    }
  }

  return best
}
