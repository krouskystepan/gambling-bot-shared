import { describe, expect, it } from 'vitest'

import {
  bumpSessionStats,
  emptySessionStats
} from '../../src/casino/types/casinoSessionStats'

describe('casinoSessionStats', () => {
  it('emptySessionStats starts at zero', () => {
    expect(emptySessionStats()).toEqual({
      roundsPlayed: 0,
      totalWagered: 0,
      totalPayout: 0,
      netProfit: 0
    })
  })

  it('bumpSessionStats accumulates rounds, wager, payout, and net', () => {
    const afterWin = bumpSessionStats(emptySessionStats(), {
      totalBet: 100,
      totalPayout: 250
    })
    expect(afterWin).toEqual({
      roundsPlayed: 1,
      totalWagered: 100,
      totalPayout: 250,
      netProfit: 150
    })

    const afterLoss = bumpSessionStats(afterWin, {
      totalBet: 50,
      totalPayout: 0
    })
    expect(afterLoss).toEqual({
      roundsPlayed: 2,
      totalWagered: 150,
      totalPayout: 250,
      netProfit: 100
    })
  })

  it('bumpSessionStats can credit multiple rounds in one settle', () => {
    const afterBatch = bumpSessionStats(emptySessionStats(), {
      totalBet: 300,
      totalPayout: 120,
      rounds: 3
    })
    expect(afterBatch).toEqual({
      roundsPlayed: 3,
      totalWagered: 300,
      totalPayout: 120,
      netProfit: -180
    })
  })
})
