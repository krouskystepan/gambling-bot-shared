export const readableGameValueNames = [
  { name: 'Maximum Bet Amount', value: 'maxBet' },
  { name: 'Minimum Bet Amount', value: 'minBet' },
  { name: 'Win Multiplier (x)', value: 'winMultiplier' },
  { name: 'Win Multipliers (x)', value: 'winMultipliers' },
  { name: 'Casino House Cut (%)', value: 'casinoCut' },
  { name: 'One-In Chance (e.g. 1 in 10,000)', value: 'oneInChance' },
  { name: 'Symbol Weights', value: 'symbolWeights' },
]

export const defaultCasinoSettings = {
  dice: {
    winMultiplier: 5,
    maxBet: 0,
    minBet: 0,
  },
  coinflip: {
    winMultiplier: 1.9,
    maxBet: 0,
    minBet: 0,
  },
  slots: {
    winMultipliers: {
      '🍒🍒🍒': 5,
      '🫐🫐🫐': 10,
      '🍉🍉🍉': 20,
      '🔔🔔🔔': 50,
      '7️⃣7️⃣7️⃣': 100,
    },
    symbolWeights: {
      '🍒': 35,
      '🫐': 25,
      '🍉': 10,
      '🔔': 4,
      '7️⃣': 2,
    },
    maxBet: 0,
    minBet: 0,
  },
  lottery: {
    winMultipliers: {
      4: 100,
      3: 40,
      2: 10,
      1: 1,
      0: 0,
    },
    maxBet: 0,
    minBet: 0,
  },
  roulette: {
    winMultipliers: {
      number: 18,
      color: 2,
      parity: 1.95,
      range: 1.95,
      dozen: 2.85,
      column: 2.85,
    },
    maxBet: 0,
    minBet: 0,
  },
  rps: {
    casinoCut: 0.025,
    maxBet: 0,
    minBet: 0,
  },
  goldenJackpot: {
    winMultiplier: 10_000,
    oneInChance: 12_000,
    maxBet: 0,
    minBet: 0,
  },
  blackjack: {
    maxBet: 0,
    minBet: 0,
  },
  prediction: {
    maxBet: 0,
    minBet: 0,
  },
}
