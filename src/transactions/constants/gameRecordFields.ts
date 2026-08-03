export const GAME_RECORD_FIELDS = {
  slots: ['winMultipliers', 'symbolWeights'],
  lottery: ['winMultipliers'],
  roulette: ['winMultipliers'],
  baccarat: ['winMultipliers', 'dragonBonusMultipliers', 'lucky6Multipliers'],
  blackjack: ['winMultipliers', 'pairsMultipliers', 'plusThreeMultipliers'],
  plinko: ['binMultipliers']
} as const

export type GameWithRecords = keyof typeof GAME_RECORD_FIELDS
export type RecordKey = (typeof GAME_RECORD_FIELDS)[GameWithRecords][number]
