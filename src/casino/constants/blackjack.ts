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
