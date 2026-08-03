import type {
  Card,
  CardLabel,
  PerfectPairsOutcome,
  PlusThreeOutcome
} from '../types/blackjackGame'
import type { TCasinoSettings } from '../types/casinoSettings'

export type BlackjackWinMultipliers =
  TCasinoSettings['blackjack']['winMultipliers']

export type BlackjackPairsMultipliers =
  TCasinoSettings['blackjack']['pairsMultipliers']

export type BlackjackPlusThreeMultipliers =
  TCasinoSettings['blackjack']['plusThreeMultipliers']

export type BlackjackPayoutOutcome = 'win' | 'blackjack' | 'push' | 'loss'

/** True when any payout multiplier is finite and > 0 (0 = disabled). */
export const hasEnabledCasinoPayouts = (
  multipliers: Record<string, unknown> | null | undefined
): boolean => {
  if (!multipliers) return false
  return Object.values(multipliers).some((value) => {
    const n = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(n) && n > 0
  })
}

export const isBlackjackPairsEnabled = (
  pairsMultipliers: BlackjackPairsMultipliers | null | undefined
): boolean => hasEnabledCasinoPayouts(pairsMultipliers)

export const isBlackjackPlusThreeEnabled = (
  plusThreeMultipliers: BlackjackPlusThreeMultipliers | null | undefined
): boolean => hasEnabledCasinoPayouts(plusThreeMultipliers)

export const isBlackjackInsuranceEnabled = (
  winMultipliers: Partial<BlackjackWinMultipliers> | null | undefined
): boolean => {
  const value = winMultipliers?.insurance
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) && n > 0
}

const RED_SUITES = new Set(['♥️', '♦️'])

const isRedSuite = (suite: Card['suite']): boolean => RED_SUITES.has(suite)

/** Ace-low rank; Ace also counts as 14 for A-high straights. */
const baseRank = (label: CardLabel): number => {
  switch (label) {
    case 'A':
      return 1
    case 'J':
      return 11
    case 'Q':
      return 12
    case 'K':
      return 13
    default:
      return Number(label)
  }
}

const isThreeCardStraight = (labels: CardLabel[]): boolean => {
  const ranks = labels.map(baseRank)
  if (new Set(ranks).size !== 3) return false

  const sorted = [...ranks].sort((a, b) => a - b)
  if (sorted[2]! - sorted[0]! === 2 && sorted[1]! - sorted[0]! === 1) {
    return true
  }

  // A-high: Q-K-A (Ace as 14). K-A-2 does not wrap.
  if (ranks.includes(1)) {
    const high = ranks.map((r) => (r === 1 ? 14 : r)).sort((a, b) => a - b)
    return high[2]! - high[0]! === 2 && high[1]! - high[0]! === 1
  }

  return false
}

/** Total return (includes stake). Loss always pays 0. */
export const getBlackjackPayout = (
  bet: number,
  outcome: BlackjackPayoutOutcome,
  winMultipliers: BlackjackWinMultipliers
): number => {
  if (outcome === 'loss') return 0
  return bet * winMultipliers[outcome]
}

/** Classify Perfect Pairs from the player's first two cards. */
export const classifyPerfectPairs = (
  cardA: Card,
  cardB: Card
): PerfectPairsOutcome => {
  if (cardA.label !== cardB.label) return 'loss'
  if (cardA.suite === cardB.suite) return 'perfect'
  if (isRedSuite(cardA.suite) === isRedSuite(cardB.suite)) return 'colored'
  return 'mixed'
}

/** Total return for Perfect Pairs (includes stake). Loss pays 0. */
export const getBlackjackPairsPayout = (
  amount: number,
  outcome: PerfectPairsOutcome,
  pairsMultipliers: BlackjackPairsMultipliers
): number => {
  if (amount <= 0 || outcome === 'loss') return 0
  return amount * pairsMultipliers[outcome]
}

/**
 * Classify 21+3 from the player's first two cards + dealer upcard.
 * Highest qualifying poker hand wins.
 */
export const classifyTwentyOnePlusThree = (
  cardA: Card,
  cardB: Card,
  dealerUp: Card
): PlusThreeOutcome => {
  const cards = [cardA, cardB, dealerUp]
  const sameRank = cardA.label === cardB.label && cardB.label === dealerUp.label
  const sameSuit = cardA.suite === cardB.suite && cardB.suite === dealerUp.suite
  const straight = isThreeCardStraight(cards.map((c) => c.label))

  if (sameRank && sameSuit) return 'suitedTrips'
  if (straight && sameSuit) return 'straightFlush'
  if (sameRank) return 'threeOfAKind'
  if (straight) return 'straight'
  if (sameSuit) return 'flush'
  return 'loss'
}

/** Total return for 21+3 (includes stake). Loss pays 0. */
export const getBlackjackPlusThreePayout = (
  amount: number,
  outcome: PlusThreeOutcome,
  plusThreeMultipliers: BlackjackPlusThreeMultipliers
): number => {
  if (amount <= 0 || outcome === 'loss') return 0
  return amount * plusThreeMultipliers[outcome]
}

/** Total return for insurance (includes stake). Pays only when dealer has BJ. */
export const getBlackjackInsurancePayout = (
  insuranceBet: number,
  dealerHasBlackjack: boolean,
  winMultipliers: BlackjackWinMultipliers
): number => {
  if (!dealerHasBlackjack || insuranceBet <= 0) return 0
  return insuranceBet * winMultipliers.insurance
}
