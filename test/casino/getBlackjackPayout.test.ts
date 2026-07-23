import { describe, expect, it } from 'vitest'

import { defaultCasinoSettings } from '../../src/casino/constants/defaultConfig'
import { getBlackjackPayout } from '../../src/casino/utils/getBlackjackPayout'
import { normalizeCasinoSettings } from '../../src/casino/utils/normalizeCasinoSettings'

const defaults = defaultCasinoSettings.blackjack.winMultipliers

describe('getBlackjackPayout', () => {
  it('uses total-return multipliers for win / blackjack / push', () => {
    expect(getBlackjackPayout(100, 'win', defaults)).toBe(200)
    expect(getBlackjackPayout(100, 'blackjack', defaults)).toBe(250)
    expect(getBlackjackPayout(100, 'push', defaults)).toBe(100)
  })

  it('returns 0 on loss', () => {
    expect(getBlackjackPayout(100, 'loss', defaults)).toBe(0)
  })

  it('honors custom multipliers', () => {
    const custom = { win: 1.8, blackjack: 3, push: 1 }
    expect(getBlackjackPayout(100, 'win', custom)).toBe(180)
    expect(getBlackjackPayout(100, 'blackjack', custom)).toBe(300)
  })
})

describe('normalizeCasinoSettings blackjack winMultipliers', () => {
  it('fills missing blackjack winMultipliers from defaults', () => {
    const normalized = normalizeCasinoSettings({
      blackjack: { maxBet: 500, minBet: 10 } as never
    })

    expect(normalized.blackjack.winMultipliers).toEqual(defaults)
    expect(normalized.blackjack.maxBet).toBe(500)
    expect(normalized.blackjack.minBet).toBe(10)
  })

  it('merges partial winMultipliers with defaults', () => {
    const normalized = normalizeCasinoSettings({
      blackjack: {
        winMultipliers: { win: 1.9 },
        maxBet: 0,
        minBet: 0
      } as never
    })

    expect(normalized.blackjack.winMultipliers).toEqual({
      win: 1.9,
      blackjack: defaults.blackjack,
      push: defaults.push
    })
  })
})
