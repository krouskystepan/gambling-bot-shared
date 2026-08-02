import { describe, expect, it } from 'vitest'

import {
  blackjackInsuranceDealerBjProb,
  calculateBlackjackInsuranceRtp,
  calculateBlackjackPairsRtp
} from '../../src/casino/constants/blackjack'
import { defaultCasinoSettings } from '../../src/casino/constants/defaultConfig'
import type { Card } from '../../src/casino/types/blackjackGame'
import {
  classifyPerfectPairs,
  classifyTwentyOnePlusThree,
  getBlackjackInsurancePayout,
  getBlackjackPairsPayout,
  getBlackjackPayout,
  getBlackjackPlusThreePayout,
  hasEnabledCasinoPayouts,
  isBlackjackInsuranceEnabled,
  isBlackjackPairsEnabled,
  isBlackjackPlusThreeEnabled
} from '../../src/casino/utils/getBlackjackPayout'
import { normalizeCasinoSettings } from '../../src/casino/utils/normalizeCasinoSettings'

const defaults = defaultCasinoSettings.blackjack.winMultipliers
const pairsDefaults = defaultCasinoSettings.blackjack.pairsMultipliers
const plusThreeDefaults = defaultCasinoSettings.blackjack.plusThreeMultipliers

const card = (
  label: Card['label'],
  suite: Card['suite'],
  value = 10
): Card => ({
  label,
  suite,
  value
})

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
    const custom = { ...defaults, win: 1.8, blackjack: 3, push: 1 }
    expect(getBlackjackPayout(100, 'win', custom)).toBe(180)
    expect(getBlackjackPayout(100, 'blackjack', custom)).toBe(300)
  })
})

describe('classifyPerfectPairs', () => {
  it('classifies perfect / colored / mixed / loss', () => {
    expect(classifyPerfectPairs(card('K', '♠️'), card('K', '♠️'))).toBe(
      'perfect'
    )
    expect(classifyPerfectPairs(card('7', '♥️'), card('7', '♦️'))).toBe(
      'colored'
    )
    expect(classifyPerfectPairs(card('7', '♠️'), card('7', '♣️'))).toBe(
      'colored'
    )
    expect(classifyPerfectPairs(card('A', '♠️'), card('A', '♥️'))).toBe('mixed')
    expect(classifyPerfectPairs(card('10', '♠️'), card('K', '♠️'))).toBe('loss')
  })
})

describe('getBlackjackPairsPayout', () => {
  it('pays total-return multipliers and 0 on loss / zero stake', () => {
    expect(getBlackjackPairsPayout(10, 'perfect', pairsDefaults)).toBe(260)
    expect(getBlackjackPairsPayout(10, 'colored', pairsDefaults)).toBe(130)
    expect(getBlackjackPairsPayout(10, 'mixed', pairsDefaults)).toBe(70)
    expect(getBlackjackPairsPayout(10, 'loss', pairsDefaults)).toBe(0)
    expect(getBlackjackPairsPayout(0, 'perfect', pairsDefaults)).toBe(0)
  })
})

describe('getBlackjackInsurancePayout', () => {
  it('pays 2:1 total return only when dealer has blackjack', () => {
    expect(getBlackjackInsurancePayout(50, true, defaults)).toBe(150)
    expect(getBlackjackInsurancePayout(50, false, defaults)).toBe(0)
    expect(getBlackjackInsurancePayout(0, true, defaults)).toBe(0)
  })
})

describe('classifyTwentyOnePlusThree', () => {
  it('classifies suited trips / straight flush / trips / straight / flush / loss', () => {
    expect(
      classifyTwentyOnePlusThree(
        card('K', '♠️'),
        card('K', '♠️'),
        card('K', '♠️')
      )
    ).toBe('suitedTrips')
    expect(
      classifyTwentyOnePlusThree(
        card('7', '♥️'),
        card('8', '♥️'),
        card('9', '♥️')
      )
    ).toBe('straightFlush')
    expect(
      classifyTwentyOnePlusThree(
        card('Q', '♠️'),
        card('Q', '♥️'),
        card('Q', '♦️')
      )
    ).toBe('threeOfAKind')
    expect(
      classifyTwentyOnePlusThree(
        card('Q', '♠️'),
        card('K', '♥️'),
        card('A', '♦️')
      )
    ).toBe('straight')
    expect(
      classifyTwentyOnePlusThree(
        card('J', '♠️'),
        card('Q', '♥️'),
        card('K', '♦️')
      )
    ).toBe('straight')
    expect(
      classifyTwentyOnePlusThree(
        card('A', '♣️'),
        card('2', '♥️'),
        card('3', '♦️')
      )
    ).toBe('straight')
    expect(
      classifyTwentyOnePlusThree(
        card('2', '♠️'),
        card('9', '♠️'),
        card('K', '♠️')
      )
    ).toBe('flush')
    expect(
      classifyTwentyOnePlusThree(
        card('2', '♠️'),
        card('9', '♥️'),
        card('K', '♦️')
      )
    ).toBe('loss')
  })

  it('does not wrap K-A-2 as a straight', () => {
    expect(
      classifyTwentyOnePlusThree(
        card('K', '♠️'),
        card('A', '♥️'),
        card('2', '♦️')
      )
    ).toBe('loss')
  })
})

describe('blackjack insurance RTP', () => {
  it('uses Ace-up ten probability for the shoe size', () => {
    expect(blackjackInsuranceDealerBjProb(2)).toBeCloseTo(32 / 103, 10)
    expect(calculateBlackjackInsuranceRtp(2, 3)).toBeCloseTo(
      (32 / 103) * 3 * 100,
      5
    )
    expect(calculateBlackjackInsuranceRtp(2, '3')).toBeCloseTo(
      (32 / 103) * 3 * 100,
      5
    )
    expect(calculateBlackjackInsuranceRtp(2, 0)).toBe(0)
    expect(calculateBlackjackInsuranceRtp(2, 'nope')).toBe(0)
  })
})

describe('blackjack pairs RTP', () => {
  it('counts perfect / colored / mixed against C(52d, 2)', () => {
    const decks = 2
    const total = (104 * 103) / 2
    const perfect = 52
    const colored = 104
    const mixed = 208
    const expected =
      ((perfect / total) * 26 + (colored / total) * 13 + (mixed / total) * 7) *
      100

    expect(
      calculateBlackjackPairsRtp(decks, {
        perfect: 26,
        colored: 13,
        mixed: 7
      })
    ).toBeCloseTo(expected, 5)
    expect(
      calculateBlackjackPairsRtp(decks, {
        perfect: '26',
        colored: '13',
        mixed: 'nope'
      })
    ).toBeCloseTo(((perfect / total) * 26 + (colored / total) * 13) * 100, 5)
  })
})

describe('hasEnabledCasinoPayouts / side-bet toggles', () => {
  it('treats all-zero or missing payout maps as disabled', () => {
    expect(hasEnabledCasinoPayouts(undefined)).toBe(false)
    expect(hasEnabledCasinoPayouts({ perfect: '26' })).toBe(true)
    expect(hasEnabledCasinoPayouts({ perfect: 'nope' })).toBe(false)
    expect(isBlackjackPairsEnabled({ perfect: 0, colored: 0, mixed: 0 })).toBe(
      false
    )
    expect(isBlackjackPlusThreeEnabled(plusThreeDefaults)).toBe(true)
    expect(
      isBlackjackPlusThreeEnabled({
        ...plusThreeDefaults,
        suitedTrips: 0,
        straightFlush: 0,
        threeOfAKind: 0,
        straight: 0,
        flush: 0
      })
    ).toBe(false)
    expect(isBlackjackInsuranceEnabled(defaults)).toBe(true)
    expect(isBlackjackInsuranceEnabled({ insurance: 0 })).toBe(false)
    expect(isBlackjackInsuranceEnabled({})).toBe(false)
    expect(isBlackjackInsuranceEnabled({ insurance: '3' } as never)).toBe(true)
  })
})

describe('getBlackjackPlusThreePayout', () => {
  it('pays graded total-return multipliers and 0 on loss / zero stake', () => {
    expect(
      getBlackjackPlusThreePayout(10, 'suitedTrips', plusThreeDefaults)
    ).toBe(1010)
    expect(
      getBlackjackPlusThreePayout(10, 'straightFlush', plusThreeDefaults)
    ).toBe(410)
    expect(
      getBlackjackPlusThreePayout(10, 'threeOfAKind', plusThreeDefaults)
    ).toBe(310)
    expect(getBlackjackPlusThreePayout(10, 'straight', plusThreeDefaults)).toBe(
      110
    )
    expect(getBlackjackPlusThreePayout(10, 'flush', plusThreeDefaults)).toBe(60)
    expect(getBlackjackPlusThreePayout(10, 'loss', plusThreeDefaults)).toBe(0)
    expect(
      getBlackjackPlusThreePayout(0, 'suitedTrips', plusThreeDefaults)
    ).toBe(0)
  })
})

describe('normalizeCasinoSettings blackjack winMultipliers', () => {
  it('fills missing blackjack winMultipliers from defaults', () => {
    const normalized = normalizeCasinoSettings({
      blackjack: { maxBet: 500, minBet: 10 } as never
    })

    expect(normalized.blackjack.winMultipliers).toEqual(defaults)
    expect(normalized.blackjack.pairsMultipliers).toEqual(pairsDefaults)
    expect(normalized.blackjack.plusThreeMultipliers).toEqual(plusThreeDefaults)
    expect(normalized.blackjack.deckCount).toBe(
      defaultCasinoSettings.blackjack.deckCount
    )
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
      push: defaults.push,
      insurance: defaults.insurance
    })
  })

  it('clamps blackjack deckCount into 2-8', () => {
    expect(
      normalizeCasinoSettings({
        blackjack: { deckCount: 1 } as never
      }).blackjack.deckCount
    ).toBe(2)
    expect(
      normalizeCasinoSettings({
        blackjack: { deckCount: 12 } as never
      }).blackjack.deckCount
    ).toBe(8)
    expect(
      normalizeCasinoSettings({
        blackjack: { deckCount: 6.4 } as never
      }).blackjack.deckCount
    ).toBe(6)
  })
})
