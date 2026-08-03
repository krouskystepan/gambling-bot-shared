export const readableGameValueNames = [
  { name: 'Maximum Bet Amount', value: 'maxBet' },
  { name: 'Minimum Bet Amount', value: 'minBet' },
  { name: 'Win Multiplier (x)', value: 'winMultiplier' },
  { name: 'Win Multipliers (x)', value: 'winMultipliers' },
  { name: 'Pairs Payouts (x)', value: 'pairsMultipliers' },
  { name: '21+3 Payouts (x)', value: 'plusThreeMultipliers' },
  { name: 'Dragon Bonus Payouts (x)', value: 'dragonBonusMultipliers' },
  { name: 'Lucky 6 Payouts (x)', value: 'lucky6Multipliers' },
  { name: 'Bin Payouts (x)', value: 'binMultipliers' },
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
  { name: 'Baccarat Minimum Multiplier', value: 'baccaratMinMultiplier' },
  { name: 'Blackjack Minimum Multiplier', value: 'blackjackMinMultiplier' },
  { name: 'Mines Minimum Multiplier', value: 'minesMinMultiplier' },
  { name: 'Minimum Mines', value: 'minMines' },
  { name: 'Maximum Mines', value: 'maxMines' },
  { name: 'Number of Decks (2-8)', value: 'deckCount' },

  // Blackjack main / side-bet outcomes
  { name: 'Win', value: 'win' },
  { name: 'Blackjack', value: 'blackjack' },
  { name: 'Push', value: 'push' },
  { name: 'Insurance', value: 'insurance' },
  { name: 'Perfect Pair', value: 'perfect' },
  { name: 'Colored Pair', value: 'colored' },
  { name: 'Mixed Pair', value: 'mixed' },
  { name: 'Suited Trips', value: 'suitedTrips' },
  { name: 'Straight Flush', value: 'straightFlush' },
  { name: 'Three of a Kind', value: 'threeOfAKind' },
  { name: 'Straight', value: 'straight' },
  { name: 'Flush', value: 'flush' },
  { name: 'Main', value: 'main' },
  { name: 'Pairs', value: 'pairs' },
  { name: '21+3', value: '21+3' },

  // Roulette bet types
  { name: 'Number', value: 'number' },
  { name: 'Color', value: 'color' },
  { name: 'Parity', value: 'parity' },
  { name: 'Range', value: 'range' },
  { name: 'Dozen', value: 'dozen' },
  { name: 'Column', value: 'column' },

  // Baccarat bet types
  { name: 'Player', value: 'player' },
  { name: 'Banker', value: 'banker' },
  { name: 'Tie', value: 'tie' },
  { name: 'Player Pair', value: 'playerPair' },
  { name: 'Banker Pair', value: 'bankerPair' },
  { name: 'Either Pair', value: 'eitherPair' },
  { name: 'Perfect Pair', value: 'perfectPair' },
  { name: 'Big', value: 'big' },
  { name: 'Small', value: 'small' },
  { name: 'Player Dragon Bonus', value: 'playerDragonBonus' },
  { name: 'Banker Dragon Bonus', value: 'bankerDragonBonus' },
  { name: 'Lucky 6', value: 'lucky6' },
  { name: 'Win by 9', value: 'winBy9' },
  { name: 'Win by 8', value: 'winBy8' },
  { name: 'Win by 7', value: 'winBy7' },
  { name: 'Win by 6', value: 'winBy6' },
  { name: 'Win by 5', value: 'winBy5' },
  { name: 'Win by 4', value: 'winBy4' },
  { name: 'Natural Win', value: 'naturalWin' },
  { name: '2-Card', value: 'twoCard' },
  { name: '3-Card', value: 'threeCard' },

  // Lottery match counts
  { name: '0 Matches', value: '0' },
  { name: '1 Match', value: '1' },
  { name: '2 Matches', value: '2' },
  { name: '3 Matches', value: '3' },
  { name: '4 Matches', value: '4' }
]

export const readableGameNames = [
  { name: 'Dice', value: 'dice' },
  { name: 'Coin Flip', value: 'coinflip' },
  { name: 'Hi-Lo', value: 'hilo' },
  { name: 'Limbo', value: 'limbo' },
  { name: 'Slots', value: 'slots' },
  { name: 'Lottery', value: 'lottery' },
  { name: 'Roulette', value: 'roulette' },
  { name: 'Baccarat', value: 'baccarat' },
  { name: 'Rock Paper Scissors', value: 'rps' },
  { name: 'Golden Jackpot', value: 'goldenJackpot' },
  { name: 'Blackjack', value: 'blackjack' },
  { name: 'Mines', value: 'mines' },
  { name: 'Prediction', value: 'prediction' },
  { name: 'Raffle', value: 'raffle' },
  { name: 'Plinko', value: 'plinko' },
  { name: 'Win Announcements', value: 'winAnnouncements' }
]

export const defaultCasinoSettings = {
  dice: {
    enabled: true,
    winMultiplier: 5,
    maxBet: 0,
    minBet: 0
  },
  coinflip: {
    enabled: true,
    winMultiplier: 1.9,
    maxBet: 0,
    minBet: 0
  },
  hilo: {
    enabled: true,
    houseEdge: 0.03,
    maxBet: 0,
    minBet: 0
  },
  limbo: {
    enabled: true,
    houseEdge: 0.03,
    maxBet: 0,
    minBet: 0
  },
  slots: {
    enabled: true,
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
    enabled: true,
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
    enabled: true,
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
  baccarat: {
    enabled: true,
    winMultipliers: {
      player: 2,
      banker: 1.95,
      tie: 9.5,
      playerPair: 12.5,
      bankerPair: 12.5,
      eitherPair: 6.5,
      perfectPair: 26,
      big: 1.55,
      small: 2.5
    },
    /** Total-return multipliers (stake included). Standard Dragon Bonus table. */
    dragonBonusMultipliers: {
      winBy9: 31, // 30:1
      winBy8: 11, // 10:1
      winBy7: 7, // 6:1
      winBy6: 5, // 4:1
      winBy5: 3, // 2:1
      winBy4: 2, // 1:1
      naturalWin: 2 // 1:1
    },
    /** Total-return multipliers. Liberal Lucky 6 (12:1 / 23:1). */
    lucky6Multipliers: {
      twoCard: 13,
      threeCard: 24
    },
    maxBet: 0,
    minBet: 0
  },
  rps: {
    enabled: true,
    houseEdge: 0.025,
    maxBet: 0,
    minBet: 0
  },
  goldenJackpot: {
    enabled: true,
    winMultiplier: 10_000,
    oneInChance: 12_000,
    maxBet: 0,
    minBet: 0
  },
  blackjack: {
    enabled: true,
    /** Total-return multipliers (stake included). Standard casino main game. */
    winMultipliers: {
      win: 2, // 1:1
      blackjack: 2.5, // 3:2
      push: 1, // stake returned
      insurance: 3 // 2:1
    },
    /**
     * Perfect Pairs total-return multipliers (Evolution / WoO pay table A).
     * Odds: Perfect 25:1, Colored 12:1, Mixed 6:1.
     */
    pairsMultipliers: {
      perfect: 26,
      colored: 13,
      mixed: 7
    },
    /**
     * Graded 21+3 total-return multipliers (common casino paytable).
     * Odds: 100:1 / 40:1 / 30:1 / 10:1 / 5:1.
     */
    plusThreeMultipliers: {
      suitedTrips: 101,
      straightFlush: 41,
      threeOfAKind: 31,
      straight: 11,
      flush: 6
    },
    /** Standard multi-deck shoe (most land casinos). Allowed range 2-8. */
    deckCount: 6,
    maxBet: 0,
    minBet: 0
  },
  mines: {
    enabled: true,
    houseEdge: 0.03,
    maxBet: 0,
    minBet: 0,
    minMines: 1,
    maxMines: 10
  },
  prediction: {
    enabled: true,
    maxBet: 0,
    minBet: 0
  },
  raffle: {
    enabled: true,
    houseEdge: 0.01
  },
  plinko: {
    enabled: true,
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
    baccaratMinMultiplier: 9,
    blackjackMinMultiplier: 0,
    minesMinMultiplier: 0,
    diceMinMultiplier: 0,
    coinflipMinMultiplier: 0,
    hiloMinMultiplier: 0,
    limboMinMultiplier: 50
  }
}
