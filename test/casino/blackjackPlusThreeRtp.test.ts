import { describe, expect, it } from 'vitest'

import { defaultCasinoSettings } from '../../src/casino/constants/defaultConfig'
import {
  calculateBlackjackPlusThreeRtp,
  countBlackjackPlusThreeHands,
  getBlackjackPlusThreeConfigWarning,
  getImpossiblePlusThreeOutcomes,
  getUnreachablePlusThreePayouts
} from '../../src/casino/utils/blackjackPlusThreeRtp'

const plusThree = defaultCasinoSettings.blackjack.plusThreeMultipliers

describe('blackjackPlusThreeRtp', () => {
  it('marks suitedTrips impossible below 3 decks only', () => {
    expect(getImpossiblePlusThreeOutcomes(2)).toEqual(['suitedTrips'])
    expect(getImpossiblePlusThreeOutcomes(3)).toEqual([])
    expect(getImpossiblePlusThreeOutcomes(8)).toEqual([])
  })

  it('flags paying suitedTrips as unreachable on a 2-deck shoe', () => {
    expect(getUnreachablePlusThreePayouts(2, plusThree)).toEqual([
      'suitedTrips'
    ])
    expect(getUnreachablePlusThreePayouts(2, undefined)).toEqual([])
    expect(
      getUnreachablePlusThreePayouts(2, { suitedTrips: '101' } as never)
    ).toEqual(['suitedTrips'])
    expect(
      getUnreachablePlusThreePayouts(2, { ...plusThree, suitedTrips: 0 })
    ).toEqual([])
    expect(getUnreachablePlusThreePayouts(6, plusThree)).toEqual([])
  })

  it('counts C(52d,3) combinations and zero suited trips at 2 decks', () => {
    const two = countBlackjackPlusThreeHands(2)
    expect(two.total).toBe((104 * 103 * 102) / 6)
    expect(two.counts.suitedTrips).toBe(0)
    expect(two.counts.threeOfAKind).toBeGreaterThan(0)
    expect(two.counts.flush).toBeGreaterThan(0)

    const three = countBlackjackPlusThreeHands(3)
    expect(three.total).toBe((156 * 155 * 154) / 6)
    expect(three.counts.suitedTrips).toBe(52)
  })

  it('computes deck-dependent 21+3 RTP from total-return multipliers', () => {
    const rtp2 = calculateBlackjackPlusThreeRtp(2, plusThree)
    const rtp6 = calculateBlackjackPlusThreeRtp(6, plusThree)
    // Graded table without suited trips is house-heavy on a 2-deck shoe.
    expect(rtp2).toBeGreaterThan(85)
    expect(rtp2).toBeLessThan(90)
    expect(rtp6).toBeGreaterThan(rtp2)
    expect(rtp6).toBeLessThan(110)

    const withStrings = calculateBlackjackPlusThreeRtp(2, {
      suitedTrips: '101',
      straightFlush: '41',
      threeOfAKind: '31',
      straight: '11',
      flush: 'not-a-number'
    } as never)
    expect(withStrings).toBeGreaterThan(0)
    expect(withStrings).toBeLessThan(rtp2)

    const withMissing = calculateBlackjackPlusThreeRtp(2, {
      suitedTrips: 101,
      straightFlush: 41,
      threeOfAKind: 31,
      straight: 11
    } as never)
    expect(withMissing).toBeGreaterThan(0)
    expect(withMissing).toBeLessThan(rtp2)
  })

  it('builds a warning that includes deck count and readable outcome', () => {
    const warning = getBlackjackPlusThreeConfigWarning({
      deckCount: 2,
      plusThreeMultipliers: plusThree
    })
    expect(warning).toMatch(/Suited Trips/)
    expect(warning).toMatch(/2 decks/)
    expect(warning).toMatch(/Set that 21\+3 payout to 0/)
    expect(
      getBlackjackPlusThreeConfigWarning({
        deckCount: 6,
        plusThreeMultipliers: plusThree
      })
    ).toBeNull()
  })
})
