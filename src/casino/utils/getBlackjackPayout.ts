import type { TCasinoSettings } from '../types/casinoSettings'

export type BlackjackWinMultipliers =
  TCasinoSettings['blackjack']['winMultipliers']

export type BlackjackPayoutOutcome = 'win' | 'blackjack' | 'push' | 'loss'

/** Total return (includes stake). Loss always pays 0. */
export const getBlackjackPayout = (
  bet: number,
  outcome: BlackjackPayoutOutcome,
  winMultipliers: BlackjackWinMultipliers
): number => {
  if (outcome === 'loss') return 0
  return bet * winMultipliers[outcome]
}
