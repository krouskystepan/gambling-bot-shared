export const readableGameValueNames = [
  { name: 'Maximum Bet Amount', value: 'maxBet' },
  { name: 'Minimum Bet Amount', value: 'minBet' },
  { name: 'Win Multiplier (x)', value: 'winMultiplier' },
  { name: 'Win Multipliers (x)', value: 'winMultipliers' },
  { name: 'House Edge (%)', value: 'houseEdge' },
  { name: 'One-In Chance (e.g. 1 in 10,000)', value: 'oneInChance' },
  { name: 'Symbol Weights', value: 'symbolWeights' },
  { name: 'Plinko Minimum Multiplier', value: 'plinkoMinMultiplier' },
  {
    name: 'Golden Jackpot Minimum Multiplier',
    value: 'goldenJackpotMinMultiplier'
  },
  { name: 'Slots Minimum Multiplier', value: 'slotsMinMultiplier' },
  { name: 'Dice Minimum Multiplier', value: 'diceMinMultiplier' },
  { name: 'Coin Flip Minimum Multiplier', value: 'coinflipMinMultiplier' },
  { name: 'Hi-Lo Minimum Multiplier', value: 'hiloMinMultiplier' },
  { name: 'Limbo Minimum Multiplier', value: 'limboMinMultiplier' },
  { name: 'Lottery Minimum Multiplier', value: 'lotteryMinMultiplier' },
  { name: 'Roulette Minimum Multiplier', value: 'rouletteMinMultiplier' },
  { name: 'Blackjack Minimum Multiplier', value: 'blackjackMinMultiplier' }
]

export const readableGameNames = [
  { name: 'Dice', value: 'dice' },
  { name: 'Coin Flip', value: 'coinflip' },
  { name: 'Hi-Lo', value: 'hilo' },
  { name: 'Limbo', value: 'limbo' },
  { name: 'Slots', value: 'slots' },
  { name: 'Lottery', value: 'lottery' },
  { name: 'Roulette', value: 'roulette' },
  { name: 'Rock Paper Scissors', value: 'rps' },
  { name: 'Golden Jackpot', value: 'goldenJackpot' },
  { name: 'Blackjack', value: 'blackjack' },
  { name: 'Prediction', value: 'prediction' },
  { name: 'Raffle', value: 'raffle' },
  { name: 'Plinko', value: 'plinko' },
  { name: 'Win Announcements', value: 'winAnnouncements' }
]

export const defaultCasinoSettings = {
  dice: {
    winMultiplier: 5,
    maxBet: 0,
    minBet: 0
  },
  coinflip: {
    winMultiplier: 1.9,
    maxBet: 0,
    minBet: 0
  },
  hilo: {
    houseEdge: 0.03,
    maxBet: 0,
    minBet: 0
  },
  limbo: {
    houseEdge: 0.03,
    maxBet: 0,
    minBet: 0
  },
  slots: {
    winMultipliers: {
      '🍒🍒🍒': 5,
      '🫐🫐🫐': 10,
      '🍉🍉🍉': 20,
      '🔔🔔🔔': 50,
      '7️⃣7️⃣7️⃣': 100
    },
    symbolWeights: {
      '🍒': 35,
      '🫐': 25,
      '🍉': 10,
      '🔔': 4,
      '7️⃣': 2
    },
    maxBet: 0,
    minBet: 0
  },
  lottery: {
    winMultipliers: {
      4: 100,
      3: 40,
      2: 10,
      1: 1,
      0: 0
    },
    maxBet: 0,
    minBet: 0
  },
  roulette: {
    winMultipliers: {
      number: 18,
      color: 2,
      parity: 1.95,
      range: 1.95,
      dozen: 2.85,
      column: 2.85
    },
    maxBet: 0,
    minBet: 0
  },
  rps: {
    houseEdge: 0.025,
    maxBet: 0,
    minBet: 0
  },
  goldenJackpot: {
    winMultiplier: 10_000,
    oneInChance: 12_000,
    maxBet: 0,
    minBet: 0
  },
  blackjack: {
    maxBet: 0,
    minBet: 0
  },
  prediction: {
    maxBet: 0,
    minBet: 0
  },
  raffle: {
    houseEdge: 0.01
  },
  plinko: {
    binMultipliers: {
      1: 8,
      2: 6,
      3: 1.5,
      4: 0.75,
      5: 0.5,
      6: 0.75,
      7: 1.5,
      8: 6,
      9: 8
    },
    maxBet: 0,
    minBet: 0
  },
  winAnnouncements: {
    plinkoMinMultiplier: 6,
    goldenJackpotMinMultiplier: 1,
    slotsMinMultiplier: 100,
    lotteryMinMultiplier: 40,
    rouletteMinMultiplier: 18,
    blackjackMinMultiplier: 0,
    diceMinMultiplier: 0,
    coinflipMinMultiplier: 0,
    hiloMinMultiplier: 0,
    limboMinMultiplier: 50
  }
}
