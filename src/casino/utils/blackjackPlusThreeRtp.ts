import { getReadableName } from '../../common/formatters'
import {
  SUITES,
  VALUES,
  normalizeBlackjackDeckCount
} from '../constants/blackjack'
import { readableGameValueNames } from '../constants/defaultConfig'
import type { Card, PlusThreeOutcome } from '../types/blackjackGame'
import {
  type BlackjackPlusThreeMultipliers,
  classifyTwentyOnePlusThree
} from './getBlackjackPayout'

const CARD_TYPES: Card[] = VALUES.flatMap((value) =>
  SUITES.map((suite) => ({
    label: value.label,
    suite,
    value: value.value
  }))
)

const EMPTY_COUNTS = (): Record<PlusThreeOutcome, number> => ({
  suitedTrips: 0,
  straightFlush: 0,
  threeOfAKind: 0,
  straight: 0,
  flush: 0,
  loss: 0
})

/**
 * 21+3 outcomes that cannot occur in a shoe of the given size.
 * Suited trips need three identical cards (rank + suit), so deckCount >= 3.
 */
export const getImpossiblePlusThreeOutcomes = (
  deckCount: unknown
): PlusThreeOutcome[] => {
  const decks = normalizeBlackjackDeckCount(deckCount)
  return decks < 3 ? ['suitedTrips'] : []
}

/** Outcomes that are configured to pay but can never hit at this shoe size. */
export const getUnreachablePlusThreePayouts = (
  deckCount: unknown,
  plusThreeMultipliers: Partial<BlackjackPlusThreeMultipliers> | undefined
): PlusThreeOutcome[] => {
  const multipliers = plusThreeMultipliers ?? {}
  return getImpossiblePlusThreeOutcomes(deckCount).filter((outcome) => {
    const value = multipliers[outcome as keyof BlackjackPlusThreeMultipliers]
    const n = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(n) && n > 0
  })
}

/**
 * Exact unordered 3-card counts for 21+3 from a fresh multi-deck shoe.
 * Combinations treat identical (rank, suit) copies as indistinguishable.
 */
export const countBlackjackPlusThreeHands = (deckCount: unknown) => {
  const decks = normalizeBlackjackDeckCount(deckCount)
  const counts = EMPTY_COUNTS()

  // Pattern A: three copies of one card type -> suited trips (needs decks >= 3).
  if (decks >= 3) {
    const ways = (decks * (decks - 1) * (decks - 2)) / 6
    counts.suitedTrips += CARD_TYPES.length * ways
  }

  // Pattern B: two of type A + one of type B.
  const waysPair = (decks * (decks - 1)) / 2
  for (let i = 0; i < CARD_TYPES.length; i++) {
    for (let j = 0; j < CARD_TYPES.length; j++) {
      if (i === j) continue
      const a = CARD_TYPES[i]!
      const b = CARD_TYPES[j]!
      counts[classifyTwentyOnePlusThree(a, a, b)] += waysPair * decks
    }
  }

  // Pattern C: three distinct card types.
  const waysDistinct = decks * decks * decks
  for (let i = 0; i < CARD_TYPES.length; i++) {
    for (let j = i + 1; j < CARD_TYPES.length; j++) {
      for (let k = j + 1; k < CARD_TYPES.length; k++) {
        counts[
          classifyTwentyOnePlusThree(
            CARD_TYPES[i]!,
            CARD_TYPES[j]!,
            CARD_TYPES[k]!
          )
        ] += waysDistinct
      }
    }
  }

  const total = Object.values(counts).reduce((sum, n) => sum + n, 0)
  return { counts, total, deckCount: decks }
}

/** Exact 21+3 RTP (%) for the given shoe size and total-return multipliers. */
export const calculateBlackjackPlusThreeRtp = (
  deckCount: unknown,
  plusThreeMultipliers: BlackjackPlusThreeMultipliers
): number => {
  const { counts, total } = countBlackjackPlusThreeHands(deckCount)

  let rtp = 0
  for (const outcome of Object.keys(counts) as PlusThreeOutcome[]) {
    if (outcome === 'loss') continue
    const multiplier = plusThreeMultipliers[outcome]
    const n =
      typeof multiplier === 'number' ? multiplier : Number(multiplier ?? 0)
    rtp += (counts[outcome] / total) * (Number.isFinite(n) ? n : 0)
  }

  return rtp * 100
}

export const getBlackjackPlusThreeConfigWarning = (blackjack: {
  deckCount: unknown
  plusThreeMultipliers:
    | BlackjackPlusThreeMultipliers
    | Partial<BlackjackPlusThreeMultipliers>
    | Record<string, unknown>
    | null
    | undefined
}): string | null => {
  const multipliers = {
    ...({} as BlackjackPlusThreeMultipliers),
    ...(blackjack.plusThreeMultipliers as
      | Partial<BlackjackPlusThreeMultipliers>
      | undefined)
  }
  const unreachable = getUnreachablePlusThreePayouts(
    blackjack.deckCount,
    multipliers
  )
  if (unreachable.length === 0) return null

  const decks = normalizeBlackjackDeckCount(blackjack.deckCount)
  const outcomes = unreachable
    .map((outcome) => getReadableName(outcome, readableGameValueNames))
    .join(', ')
  return `${outcomes} cannot hit with ${decks} decks. Set that 21+3 payout to 0 to disable it.`
}
