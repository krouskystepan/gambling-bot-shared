import {
  BLACKJACK_DECK_MAX,
  BLACKJACK_DECK_MIN,
  CASINO_GAME_IDS,
  COINFLIP_MAX_SIMULATE_FLIPS,
  DICE_MAX_SIMULATE_ROLLS,
  GAME_RECORD_FIELDS,
  GOLDEN_JACKPOT_MAX_SIMULATE_ENTRIES,
  LOTTERY_MAX_SIMULATE_ENTRIES,
  SLOT_MAX_SIMULATE_SPINS,
  SUITES,
  VALUES,
  baccaratCardValue,
  baccaratIdleCloseMs,
  baccaratIdleNudgeThresholdMs,
  blackjackAutostandIdleMs,
  blackjackIdleCloseMs,
  blackjackIdleNudgeThresholdMs,
  calculateRTP,
  casinoSettingsSchema,
  dealBaccaratRound,
  defaultCasinoSettings,
  expandPlinkoBinMultipliers,
  formatPlinkoBinMultipliersForDisplay,
  getHiloWinMultiplier,
  getMinesFairMultiplier,
  getMinesPayoutMultiplier,
  getPlinkoMirrorBin,
  getPlinkoMultiplierAtPathIndex,
  handTotal,
  hiloRankFromLabel,
  hoursUntilBaccaratIdleClose,
  hoursUntilBlackjackAutostand,
  hoursUntilBlackjackIdleClose,
  hoursUntilMinesAutoResolve,
  hoursUntilMinesIdleClose,
  hoursUntilRouletteIdleClose,
  hoursUntilSlotsIdleClose,
  isBaccaratFlatBetSide,
  isCasinoGameEnabled,
  isLimboWin,
  isNaturalHand,
  isPair,
  isPerfectPair,
  isValidBaccaratBetSide,
  isValidLimboTarget,
  isValidMineCount,
  limboHitProbability,
  minesAutoResolveIdleMs,
  minesIdleCloseMs,
  minesIdleNudgeThresholdMs,
  normalizeBlackjackDeckCount,
  normalizeCasinoSettings,
  normalizePlinkoBinMultipliers,
  pathIndexToPlinkoBin,
  pickSafestHiloGuess,
  plinkoBinToPathIndex,
  resolveBaccaratBet,
  resolveBaccaratSlip,
  resolveHiloRound,
  rollLimboResult,
  rouletteIdleCloseMs,
  rouletteIdleNudgeThresholdMs,
  shouldAnnounceByMultiplier,
  shouldAnnounceGoldenJackpotHit,
  shouldAnnouncePlinkoBall,
  shouldBankerDrawThird,
  shouldPlayerDrawThird,
  slotsIdleCloseMs,
  slotsIdleNudgeThresholdMs,
  validateBetAmount
} from 'gambling-bot-shared/casino'
import {
  TRANSACTION_SOURCES,
  TRANSACTION_TYPES
} from 'gambling-bot-shared/transactions'
import { describe, expect, it, vi } from 'vitest'

describe('validateBetAmount', () => {
  it('accepts valid bet within limits', () => {
    expect(validateBetAmount(50, 1000, 10)).toEqual({ ok: true })
  })

  it('rejects invalid amounts', () => {
    expect(validateBetAmount(Number.NaN, 0, 0)).toEqual({
      ok: false,
      error: 'INVALID_NUMBER'
    })
    expect(validateBetAmount(1.234, 0, 0)).toEqual({
      ok: false,
      error: 'TOO_MANY_DECIMALS'
    })
    expect(validateBetAmount(0.5, 0, 0)).toEqual({
      ok: false,
      error: 'BELOW_MINIMUM'
    })
    expect(validateBetAmount(500, 100, 0)).toEqual({
      ok: false,
      error: 'ABOVE_MAXIMUM'
    })
    expect(validateBetAmount(5, 0, 10)).toEqual({
      ok: false,
      error: 'BELOW_MIN_BET'
    })
  })
})

describe('normalizeCasinoSettings', () => {
  it('returns defaults when input is null', () => {
    const normalized = normalizeCasinoSettings(null)
    expect(normalized.plinko.binMultipliers['5']).toBe(
      defaultCasinoSettings.plinko.binMultipliers['5']
    )
  })

  it('fills missing winAnnouncements from defaults', () => {
    const { winAnnouncements: _ignored, ...withoutWinAnnouncements } =
      defaultCasinoSettings

    const normalized = normalizeCasinoSettings(withoutWinAnnouncements)

    expect(normalized.winAnnouncements).toEqual(
      defaultCasinoSettings.winAnnouncements
    )
  })

  it('deep-merges nested objects', () => {
    const normalized = normalizeCasinoSettings({
      dice: { ...defaultCasinoSettings.dice, winMultiplier: 7 }
    })
    expect(normalized.dice.winMultiplier).toBe(7)
    expect(normalized.coinflip.winMultiplier).toBe(
      defaultCasinoSettings.coinflip.winMultiplier
    )
  })

  it('migrates legacy casinoCut to houseEdge', () => {
    const normalized = normalizeCasinoSettings({
      rps: { casinoCut: 0.1, maxBet: 0, minBet: 0 } as never,
      raffle: { casinoCut: 0.05 } as never
    })
    expect(normalized.rps.houseEdge).toBe(0.1)
    expect(normalized.raffle.houseEdge).toBe(0.05)
    expect('casinoCut' in (normalized.rps as Record<string, unknown>)).toBe(
      false
    )
  })

  it('fills enabled: true when omitted from stored settings', () => {
    const { enabled: _ignored, ...diceWithoutEnabled } =
      defaultCasinoSettings.dice

    const normalized = normalizeCasinoSettings({
      dice: diceWithoutEnabled as never
    })

    expect(normalized.dice.enabled).toBe(true)
    for (const gameId of CASINO_GAME_IDS) {
      expect(normalized[gameId].enabled).toBe(true)
    }
  })

  it('preserves enabled: false through normalize', () => {
    const normalized = normalizeCasinoSettings({
      dice: { ...defaultCasinoSettings.dice, enabled: false },
      raffle: { ...defaultCasinoSettings.raffle, enabled: false }
    })
    expect(normalized.dice.enabled).toBe(false)
    expect(normalized.raffle.enabled).toBe(false)
  })
})

describe('isCasinoGameEnabled', () => {
  it('returns true for enabled games and false when disabled', () => {
    expect(isCasinoGameEnabled(defaultCasinoSettings, 'dice')).toBe(true)
    expect(
      isCasinoGameEnabled(
        {
          ...defaultCasinoSettings,
          dice: { ...defaultCasinoSettings.dice, enabled: false }
        },
        'dice'
      )
    ).toBe(false)
  })
})

describe('calculateRTP', () => {
  it('computes RTP for each casino game', () => {
    expect(calculateRTP('dice', defaultCasinoSettings.dice)).toBeGreaterThan(0)
    expect(calculateRTP('coinflip', defaultCasinoSettings.coinflip)).toBe(95)
    expect(calculateRTP('hilo', defaultCasinoSettings.hilo)).toBe(97)
    expect(calculateRTP('limbo', defaultCasinoSettings.limbo)).toBe(97)
    expect(calculateRTP('mines', defaultCasinoSettings.mines)).toBe(97)
    expect(calculateRTP('slots', defaultCasinoSettings.slots)).toBeGreaterThan(
      0
    )
    expect(
      calculateRTP('lottery', defaultCasinoSettings.lottery)
    ).toBeGreaterThan(0)
    expect(calculateRTP('roulette', defaultCasinoSettings.roulette)).toEqual(
      expect.objectContaining({
        number: expect.any(Number),
        color: expect.any(Number)
      })
    )
    expect(calculateRTP('baccarat', defaultCasinoSettings.baccarat)).toEqual(
      expect.objectContaining({
        player: expect.any(Number),
        banker: expect.any(Number),
        tie: expect.any(Number),
        playerPair: expect.any(Number),
        bankerPair: expect.any(Number),
        eitherPair: expect.any(Number),
        perfectPair: expect.any(Number),
        big: expect.any(Number),
        small: expect.any(Number),
        playerDragonBonus: expect.any(Number),
        bankerDragonBonus: expect.any(Number),
        lucky6: expect.any(Number)
      })
    )
    expect(calculateRTP('rps', defaultCasinoSettings.rps)).toBeGreaterThan(0)
    expect(
      calculateRTP('goldenJackpot', defaultCasinoSettings.goldenJackpot)
    ).toBeGreaterThan(0)
    expect(
      calculateRTP('raffle', defaultCasinoSettings.raffle)
    ).toBeGreaterThan(0)
    const defaultBlackjackRtp = calculateRTP(
      'blackjack',
      defaultCasinoSettings.blackjack
    ) as Record<string, number>
    expect(defaultBlackjackRtp.main).toBeCloseTo(99.5, 5)
    expect(defaultBlackjackRtp.pairs).toBeGreaterThan(0)
    {
      const decks = defaultCasinoSettings.blackjack.deckCount
      const pDealerBj = (16 * decks) / (52 * decks - 1)
      expect(defaultBlackjackRtp.insurance).toBeCloseTo(
        pDealerBj *
          defaultCasinoSettings.blackjack.winMultipliers.insurance *
          100,
        5
      )
    }
    expect(defaultBlackjackRtp['21+3']).toBeGreaterThan(0)
    const disabledPlusThreeRtp = calculateRTP('blackjack', {
      ...defaultCasinoSettings.blackjack,
      plusThreeMultipliers: {
        suitedTrips: 0,
        straightFlush: 0,
        threeOfAKind: 0,
        straight: 0,
        flush: 0
      }
    }) as Record<string, number>
    expect(disabledPlusThreeRtp.main).toBeCloseTo(99.5, 5)
    expect(disabledPlusThreeRtp).not.toHaveProperty('21+3')
    const disabledInsuranceRtp = calculateRTP('blackjack', {
      ...defaultCasinoSettings.blackjack,
      winMultipliers: {
        ...defaultCasinoSettings.blackjack.winMultipliers,
        insurance: 0
      }
    }) as Record<string, number>
    expect(disabledInsuranceRtp).not.toHaveProperty('insurance')
    const disabledPairsRtp = calculateRTP('blackjack', {
      ...defaultCasinoSettings.blackjack,
      pairsMultipliers: { perfect: 0, colored: 0, mixed: 0 }
    }) as Record<string, number>
    expect(disabledPairsRtp).not.toHaveProperty('pairs')
    expect(
      (
        calculateRTP('blackjack', {
          ...defaultCasinoSettings.blackjack,
          winMultipliers: {
            ...defaultCasinoSettings.blackjack.winMultipliers,
            win: 1.8,
            blackjack: 2,
            push: 1
          }
        }) as Record<string, number>
      ).main
    ).toBeLessThan(99.5)
    expect(
      (
        calculateRTP('blackjack', {
          maxBet: 0,
          minBet: 0
        } as never) as Record<string, number>
      ).main
    ).toBeCloseTo(99.5, 5)
    expect(calculateRTP('prediction', defaultCasinoSettings.prediction)).toBe(0)
    expect(
      calculateRTP('plinko', defaultCasinoSettings.plinko)
    ).toBeGreaterThan(0)
    expect(
      calculateRTP('winAnnouncements', defaultCasinoSettings.winAnnouncements)
    ).toBe(0)
  })

  it('parses string multipliers', () => {
    expect(calculateRTP('dice', { winMultiplier: '6' } as never)).toBe(100)
    expect(
      calculateRTP('dice', { winMultiplier: 'not-a-number' } as never)
    ).toBe(0)
    expect(calculateRTP('dice', defaultCasinoSettings.dice)).toBeGreaterThan(0)
    expect(
      calculateRTP('dice', { winMultiplier: {} as unknown as number } as never)
    ).toBe(0)
    expect(
      calculateRTP('dice', {
        winMultiplier: null as unknown as number
      } as never)
    ).toBe(0)
    expect(
      calculateRTP('slots', {
        symbolWeights: { '🍒': 1 },
        winMultipliers: {}
      } as never)
    ).toBe(0)
    expect(
      calculateRTP('lottery', { winMultipliers: { 0: 10 } } as never)
    ).toBeGreaterThan(0)
  })

  it('warns for unimplemented game keys', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(vi.fn())
    calculateRTP(
      'not-a-game' as keyof typeof defaultCasinoSettings,
      {} as never
    )
    expect(warn).toHaveBeenCalledWith('RTP for not-a-game not implemented')
    warn.mockRestore()
  })
})

describe('win announcement thresholds', () => {
  it('shouldAnnounceByMultiplier', () => {
    expect(shouldAnnounceByMultiplier(100, 100)).toBe(true)
    expect(shouldAnnounceByMultiplier(50, 100)).toBe(false)
    expect(shouldAnnounceByMultiplier(100, 0)).toBe(false)
  })

  it('shouldAnnouncePlinkoBall', () => {
    expect(shouldAnnouncePlinkoBall(8, 6)).toBe(true)
    expect(shouldAnnouncePlinkoBall(5.99, 6)).toBe(false)
  })

  it('shouldAnnounceGoldenJackpotHit', () => {
    expect(shouldAnnounceGoldenJackpotHit(10_000, 1)).toBe(true)
    expect(shouldAnnounceGoldenJackpotHit(100, 1_000)).toBe(false)
  })
})

describe('plinko bin config', () => {
  it('maps and mirrors bins', () => {
    expect(pathIndexToPlinkoBin(0)).toBe(1)
    expect(pathIndexToPlinkoBin(8)).toBe(9)
    expect(plinkoBinToPathIndex(5)).toBe(4)
    expect(getPlinkoMirrorBin(1)).toBe(9)
    expect(getPlinkoMirrorBin(5)).toBe(5)
  })

  it('expands editable bins to symmetric layout', () => {
    expect(
      expandPlinkoBinMultipliers({
        1: 8,
        2: 6,
        3: 1.5,
        4: 0.75,
        5: 0.5
      })
    ).toEqual({
      '1': 8,
      '2': 6,
      '3': 1.5,
      '4': 0.75,
      '5': 0.5,
      '6': 0.75,
      '7': 1.5,
      '8': 6,
      '9': 8
    })
  })

  it('coerces string and invalid multiplier values', () => {
    const expanded = expandPlinkoBinMultipliers({
      1: '8',
      2: 6,
      3: 1.5,
      4: 0.75,
      5: 'invalid'
    })
    expect(expanded['1']).toBe(8)
    expect(expanded['5']).toBe(0)
    expect(
      expandPlinkoBinMultipliers({
        1: {} as unknown as number,
        2: 6,
        3: 1.5,
        4: 0.75,
        5: 0.5
      })['1']
    ).toBe(0)
  })

  it('uses defaults for empty input', () => {
    const normalized = normalizePlinkoBinMultipliers(null)
    expect(normalized['1']).toBe(
      defaultCasinoSettings.plinko.binMultipliers['1']
    )
  })

  it('migrates legacy 0-indexed bins', () => {
    const normalized = normalizePlinkoBinMultipliers({
      0: 8,
      1: 6,
      2: 1.5,
      3: 0.75,
      4: 0.5,
      5: 0.75,
      6: 1.5,
      7: 6,
      8: 8
    })

    expect(normalized['1']).toBe(8)
    expect(normalized['5']).toBe(0.5)
    expect(normalized['9']).toBe(8)
  })

  it('skips non-finite keys', () => {
    const normalized = normalizePlinkoBinMultipliers({
      abc: 99,
      1: 8,
      2: 6,
      3: 1.5,
      4: 0.75,
      5: 0.5
    })
    expect(normalized['1']).toBe(8)
  })

  it('reads multiplier at path index and formats display bins', () => {
    const multipliers = { 1: 8, 2: 6, 3: 1.5, 4: 0.75, 5: 0.5 }
    expect(getPlinkoMultiplierAtPathIndex(multipliers, 0)).toBe(8)
    expect(getPlinkoMultiplierAtPathIndex(multipliers, 9)).toBe(0)
    expect(formatPlinkoBinMultipliersForDisplay(multipliers)).toEqual({
      '1': 8,
      '2': 6,
      '3': 1.5,
      '4': 0.75,
      '5': 0.5
    })
  })

  it('fills missing bins from defaults', () => {
    expect(normalizePlinkoBinMultipliers({ 0: 8 })['2']).toBe(
      defaultCasinoSettings.plinko.binMultipliers['2']
    )
    expect(normalizePlinkoBinMultipliers({ 2: 6 })['1']).toBe(
      defaultCasinoSettings.plinko.binMultipliers['1']
    )
    expect(
      expandPlinkoBinMultipliers({
        '1': 8,
        '2': 6,
        '3': 1.5,
        '4': 0.75,
        '5': 0.5
      })['1']
    ).toBe(8)
    expect(expandPlinkoBinMultipliers({})['3']).toBe(
      defaultCasinoSettings.plinko.binMultipliers['3']
    )
  })
})

describe('casino constants', () => {
  it('exports game ids and simulation limits', () => {
    expect(CASINO_GAME_IDS).toContain('dice')
    expect(DICE_MAX_SIMULATE_ROLLS).toBeGreaterThan(0)
    expect(COINFLIP_MAX_SIMULATE_FLIPS).toBeGreaterThan(0)
    expect(SLOT_MAX_SIMULATE_SPINS).toBeGreaterThan(0)
    expect(LOTTERY_MAX_SIMULATE_ENTRIES).toBeGreaterThan(0)
    expect(GOLDEN_JACKPOT_MAX_SIMULATE_ENTRIES).toBeGreaterThan(0)
  })

  it('exports blackjack deck count bounds', () => {
    expect(BLACKJACK_DECK_MIN).toBe(2)
    expect(BLACKJACK_DECK_MAX).toBe(8)
    expect(normalizeBlackjackDeckCount(1)).toBe(2)
    expect(normalizeBlackjackDeckCount(9)).toBe(8)
    expect(normalizeBlackjackDeckCount('6')).toBe(6)
    expect(normalizeBlackjackDeckCount('nope')).toBe(2)
    expect(normalizeBlackjackDeckCount(Number.NaN)).toBe(2)
  })

  it('exports blackjack card constants', () => {
    expect(SUITES.length).toBe(4)
    expect(VALUES[0].value).toBe(11)
  })

  it('computes hours until blackjack autostand', () => {
    const now = Date.parse('2024-06-15T12:00:00Z')
    const updatedAt = new Date(now - 6 * 60 * 60 * 1000)

    expect(hoursUntilBlackjackAutostand(updatedAt, now)).toBe(18)
    expect(
      hoursUntilBlackjackAutostand(new Date(now - 23 * 60 * 60 * 1000), now)
    ).toBe(1)
  })

  it('computes hours until blackjack idle close', () => {
    const now = Date.parse('2024-06-15T12:00:00Z')
    const updatedAt = new Date(now - 6 * 60 * 60 * 1000)

    expect(hoursUntilBlackjackIdleClose(updatedAt, now)).toBe(18)
    expect(
      hoursUntilBlackjackIdleClose(new Date(now - 23 * 60 * 60 * 1000), now)
    ).toBe(1)
    expect(blackjackIdleCloseMs()).toBe(24 * 60 * 60 * 1000)
  })

  it('computes hours until baccarat idle close', () => {
    const now = Date.parse('2024-06-15T12:00:00Z')
    const updatedAt = new Date(now - 6 * 60 * 60 * 1000)

    expect(hoursUntilBaccaratIdleClose(updatedAt, now)).toBe(18)
    expect(
      hoursUntilBaccaratIdleClose(new Date(now - 23 * 60 * 60 * 1000), now)
    ).toBe(1)
    expect(baccaratIdleNudgeThresholdMs()).toBe(3 * 60 * 60 * 1000)
    expect(baccaratIdleCloseMs()).toBe(24 * 60 * 60 * 1000)
  })

  it('computes hours until mines auto-resolve', () => {
    const now = Date.parse('2024-06-15T12:00:00Z')
    const updatedAt = new Date(now - 6 * 60 * 60 * 1000)

    expect(hoursUntilMinesAutoResolve(updatedAt, now)).toBe(18)
    expect(
      hoursUntilMinesAutoResolve(new Date(now - 23 * 60 * 60 * 1000), now)
    ).toBe(1)
  })

  it('computes hours until mines idle close', () => {
    const now = Date.parse('2024-06-15T12:00:00Z')
    const updatedAt = new Date(now - 6 * 60 * 60 * 1000)

    expect(hoursUntilMinesIdleClose(updatedAt, now)).toBe(18)
    expect(
      hoursUntilMinesIdleClose(new Date(now - 23 * 60 * 60 * 1000), now)
    ).toBe(1)
    expect(minesIdleCloseMs()).toBe(24 * 60 * 60 * 1000)
  })

  it('computes hours until roulette idle close', () => {
    const now = Date.parse('2024-06-15T12:00:00Z')
    const updatedAt = new Date(now - 6 * 60 * 60 * 1000)

    expect(hoursUntilRouletteIdleClose(updatedAt, now)).toBe(18)
    expect(
      hoursUntilRouletteIdleClose(new Date(now - 23 * 60 * 60 * 1000), now)
    ).toBe(1)
    expect(rouletteIdleNudgeThresholdMs()).toBe(3 * 60 * 60 * 1000)
    expect(rouletteIdleCloseMs()).toBe(24 * 60 * 60 * 1000)
  })

  it('computes hours until slots idle close', () => {
    const now = Date.parse('2024-06-15T12:00:00Z')
    const updatedAt = new Date(now - 6 * 60 * 60 * 1000)

    expect(hoursUntilSlotsIdleClose(updatedAt, now)).toBe(18)
    expect(
      hoursUntilSlotsIdleClose(new Date(now - 23 * 60 * 60 * 1000), now)
    ).toBe(1)
    expect(slotsIdleNudgeThresholdMs()).toBe(3 * 60 * 60 * 1000)
    expect(slotsIdleCloseMs()).toBe(24 * 60 * 60 * 1000)
  })

  it('includes mines in casino game ids', () => {
    expect(CASINO_GAME_IDS).toContain('mines')
  })

  it('includes baccarat in casino game ids and record fields', () => {
    expect(CASINO_GAME_IDS).toContain('baccarat')
    expect(GAME_RECORD_FIELDS.baccarat).toContain('winMultipliers')
    expect(GAME_RECORD_FIELDS.baccarat).toContain('dragonBonusMultipliers')
    expect(GAME_RECORD_FIELDS.baccarat).toContain('lucky6Multipliers')
  })

  it('includes blackjack winMultipliers in record fields', () => {
    expect(GAME_RECORD_FIELDS.blackjack).toContain('winMultipliers')
    expect(GAME_RECORD_FIELDS.blackjack).toContain('pairsMultipliers')
    expect(GAME_RECORD_FIELDS.blackjack).toContain('plusThreeMultipliers')
  })

  it('exports blackjack worker timing constants', () => {
    expect(blackjackIdleNudgeThresholdMs()).toBe(3 * 60 * 60 * 1000)
    expect(blackjackAutostandIdleMs()).toBe(24 * 60 * 60 * 1000)
  })

  it('exports mines worker timing constants', () => {
    expect(minesIdleNudgeThresholdMs()).toBe(3 * 60 * 60 * 1000)
    expect(minesAutoResolveIdleMs()).toBe(24 * 60 * 60 * 1000)
  })

  it('exports transaction and game record constants', () => {
    expect(TRANSACTION_TYPES).toContain('bet')
    expect(TRANSACTION_SOURCES).toContain('casino')
    expect(GAME_RECORD_FIELDS.slots).toContain('symbolWeights')
    expect(GAME_RECORD_FIELDS.plinko).toContain('binMultipliers')
  })
})

describe('hiloRankFromLabel', () => {
  it('maps labels to ace-high ranks', () => {
    expect(hiloRankFromLabel('2')).toBe(2)
    expect(hiloRankFromLabel('10')).toBe(10)
    expect(hiloRankFromLabel('J')).toBe(11)
    expect(hiloRankFromLabel('Q')).toBe(12)
    expect(hiloRankFromLabel('K')).toBe(13)
    expect(hiloRankFromLabel('A')).toBe(14)
  })

  it('throws on unknown labels', () => {
    expect(() => hiloRankFromLabel('X')).toThrow(/Unknown Hi-Lo card label/)
  })
})

describe('hilo odds', () => {
  it('pays full-deck odds with house edge (same rank loses for higher/lower)', () => {
    // Middle card (8): 24 higher of 51 remaining → mult = 0.97 * 51 / 24
    expect(getHiloWinMultiplier(8, 'higher', 0.03)).toBeCloseTo(
      (0.97 * 51) / 24,
      5
    )
    expect(getHiloWinMultiplier(8, 'lower', 0.03)).toBeCloseTo(
      (0.97 * 51) / 24,
      5
    )
    // King: 4 aces higher, 44 lower
    expect(getHiloWinMultiplier(13, 'higher', 0.03)).toBeCloseTo(
      (0.97 * 51) / 4,
      5
    )
    expect(getHiloWinMultiplier(13, 'lower', 0.03)).toBeCloseTo(
      (0.97 * 51) / 44,
      5
    )
    expect(getHiloWinMultiplier(14, 'higher', 0.03)).toBeNull()
    expect(getHiloWinMultiplier(2, 'lower', 0.03)).toBeNull()
    // Same rank: 3 of 51 remaining
    expect(getHiloWinMultiplier(2, 'same', 0.03)).toBeCloseTo(
      (0.97 * 51) / 3,
      5
    )
    expect(getHiloWinMultiplier(14, 'same', 0.03)).toBeCloseTo(
      (0.97 * 51) / 3,
      5
    )
  })

  it('resolves win lose (draw is only a win on same)', () => {
    expect(resolveHiloRound(8, 10, 'higher')).toBe('win')
    expect(resolveHiloRound(8, 5, 'higher')).toBe('lose')
    expect(resolveHiloRound(8, 8, 'higher')).toBe('lose')
    expect(resolveHiloRound(8, 5, 'lower')).toBe('win')
    expect(resolveHiloRound(8, 8, 'lower')).toBe('lose')
    expect(resolveHiloRound(8, 8, 'same')).toBe('win')
    expect(resolveHiloRound(8, 10, 'same')).toBe('lose')
  })

  it('picks the lowest-multiplier side as safest on timeout', () => {
    // Ace: only lower / same; lower has far more favorable cards.
    expect(pickSafestHiloGuess(14, 0.03)).toBe('lower')
    // Two: only higher / same.
    expect(pickSafestHiloGuess(2, 0.03)).toBe('higher')
    // King: lower (~1.1x) beats higher (~12x) and same (~16x).
    expect(pickSafestHiloGuess(13, 0.03)).toBe('lower')
    // Middle 8: higher and lower tie; prefer higher (iteration order).
    expect(pickSafestHiloGuess(8, 0.03)).toBe('higher')
  })
})

describe('limbo math', () => {
  const houseEdge = 0.03

  it('keeps hitProb × target ≈ 1 - houseEdge for common targets', () => {
    for (const target of [2, 10, 100]) {
      expect(limboHitProbability(target, houseEdge) * target).toBeCloseTo(
        1 - houseEdge,
        10
      )
    }
  })

  it('rolls and rounds to 2 decimals with floor at 1.00', () => {
    // U=1 → raw 0.97 → floored display to 1.00
    expect(rollLimboResult(houseEdge, 1)).toBe(1)
    expect(rollLimboResult(houseEdge, 0.485)).toBe(2)
    expect(rollLimboResult(houseEdge, Number.EPSILON)).toBeGreaterThan(1)
  })

  it('uses rounded result for win checks', () => {
    expect(isLimboWin(2, 2)).toBe(true)
    expect(isLimboWin(1.99, 2)).toBe(false)
    expect(isLimboWin(10.5, 10)).toBe(true)
  })

  it('validates target bounds', () => {
    expect(isValidLimboTarget(1.01)).toBe(true)
    expect(isValidLimboTarget(1_000_000)).toBe(true)
    expect(isValidLimboTarget(1)).toBe(false)
    expect(isValidLimboTarget(1_000_001)).toBe(false)
    expect(isValidLimboTarget(NaN)).toBe(false)
  })
})

describe('baccarat math', () => {
  const card = (label: string, suite = '♠️') => ({ label, suite })
  const payouts = {
    winMultipliers: defaultCasinoSettings.baccarat.winMultipliers,
    dragonBonusMultipliers:
      defaultCasinoSettings.baccarat.dragonBonusMultipliers,
    lucky6Multipliers: defaultCasinoSettings.baccarat.lucky6Multipliers
  }
  const flags = (
    overrides: Partial<{
      outcome: 'player' | 'banker' | 'tie'
      playerPair: boolean
      bankerPair: boolean
      perfectPlayerPair: boolean
      perfectBankerPair: boolean
      cardCount: number
      playerTotal: number
      bankerTotal: number
      playerCards: ReturnType<typeof card>[]
      bankerCards: ReturnType<typeof card>[]
    }> = {}
  ) => ({
    outcome: 'player' as const,
    playerPair: false,
    bankerPair: false,
    perfectPlayerPair: false,
    perfectBankerPair: false,
    cardCount: 4,
    playerTotal: 7,
    bankerTotal: 5,
    playerCards: [card('K'), card('7')],
    bankerCards: [card('K'), card('5')],
    ...overrides
  })

  it('maps face values (A=1, 10/JQK=0)', () => {
    expect(baccaratCardValue('A')).toBe(1)
    expect(baccaratCardValue('9')).toBe(9)
    expect(baccaratCardValue('10')).toBe(0)
    expect(baccaratCardValue('J')).toBe(0)
    expect(baccaratCardValue('Q')).toBe(0)
    expect(baccaratCardValue('K')).toBe(0)
    expect(() => baccaratCardValue('X')).toThrow(/Unknown baccarat card label/)
  })

  it('totals hands modulo 10 and detects pairs', () => {
    expect(handTotal([card('9'), card('8')])).toBe(7)
    expect(handTotal([card('K'), card('A')])).toBe(1)
    expect(isPair([card('7', '♠️'), card('7', '♥️')])).toBe(true)
    expect(isPair([card('7'), card('8')])).toBe(false)
    expect(isPair([card('7')])).toBe(false)
    expect(isPerfectPair([card('7', '♠️'), card('7', '♠️')])).toBe(true)
    expect(isPerfectPair([card('7', '♠️'), card('7', '♥️')])).toBe(false)
  })

  it('applies natural stand and player third-card rule', () => {
    expect(shouldPlayerDrawThird(5)).toBe(true)
    expect(shouldPlayerDrawThird(6)).toBe(false)
  })

  it('applies banker tableau samples', () => {
    // Player stands → banker draws on 0–5
    expect(shouldBankerDrawThird(5, false)).toBe(true)
    expect(shouldBankerDrawThird(6, false)).toBe(false)

    // Banker 0–2 always draws after player third
    expect(shouldBankerDrawThird(2, true, 8)).toBe(true)

    // Banker 3 draws unless player third is 8
    expect(shouldBankerDrawThird(3, true, 7)).toBe(true)
    expect(shouldBankerDrawThird(3, true, 8)).toBe(false)

    // Banker 4 draws on player third 2–7
    expect(shouldBankerDrawThird(4, true, 2)).toBe(true)
    expect(shouldBankerDrawThird(4, true, 1)).toBe(false)

    // Banker 5 draws on player third 4–7
    expect(shouldBankerDrawThird(5, true, 4)).toBe(true)
    expect(shouldBankerDrawThird(5, true, 3)).toBe(false)

    // Banker 6 draws only on player third 6–7
    expect(shouldBankerDrawThird(6, true, 6)).toBe(true)
    expect(shouldBankerDrawThird(6, true, 5)).toBe(false)

    // Banker 7 always stands after player third
    expect(shouldBankerDrawThird(7, true, 6)).toBe(false)
  })

  it('deals naturals without third cards', () => {
    const shoe = [
      card('9'),
      card('K'), // player 9
      card('8'),
      card('A'), // banker 9
      card('2'),
      card('3')
    ]
    const round = dealBaccaratRound(() => shoe.shift()!)
    expect(round.playerCards).toHaveLength(2)
    expect(round.bankerCards).toHaveLength(2)
    expect(round.outcome).toBe('tie')
    expect(round.playerTotal).toBe(9)
    expect(round.bankerTotal).toBe(9)
    expect(round.cardCount).toBe(4)
  })

  it('deals player third then banker tableau', () => {
    // Player 4 (draws), Banker 3; player third = 8 → banker stands
    const shoe = [
      card('2'),
      card('2'), // player 4
      card('2'),
      card('A'), // banker 3
      card('8'), // player third
      card('K') // unused
    ]
    const round = dealBaccaratRound(() => shoe.shift()!)
    expect(round.playerCards).toHaveLength(3)
    expect(round.bankerCards).toHaveLength(2)
    expect(round.playerTotal).toBe(2)
    expect(round.bankerTotal).toBe(3)
    expect(round.outcome).toBe('banker')
    expect(round.cardCount).toBe(5)
  })

  it('deals when player stands and banker draws', () => {
    // Player 6 (stands), Banker 4 (draws)
    const shoe = [
      card('3'),
      card('3'), // player 6
      card('2'),
      card('2'), // banker 4
      card('A') // banker third → 5
    ]
    const round = dealBaccaratRound(() => shoe.shift()!)
    expect(round.playerCards).toHaveLength(2)
    expect(round.bankerCards).toHaveLength(3)
    expect(round.playerTotal).toBe(6)
    expect(round.bankerTotal).toBe(5)
    expect(round.outcome).toBe('player')
    expect(round.cardCount).toBe(5)
  })

  it('flags suited pairs on deal', () => {
    const shoe = [
      card('9', '♠️'),
      card('9', '♠️'), // perfect player pair, natural 8
      card('K', '♥️'),
      card('A', '♦️') // banker 1
    ]
    const round = dealBaccaratRound(() => shoe.shift()!)
    expect(round.playerPair).toBe(true)
    expect(round.perfectPlayerPair).toBe(true)
    expect(round.bankerPair).toBe(false)
    expect(round.perfectBankerPair).toBe(false)
    expect(round.cardCount).toBe(4)
  })

  it('resolves main bets with push on tie and pair sides', () => {
    expect(
      resolveBaccaratBet('player', flags({ outcome: 'player' }), payouts)
    ).toEqual({ won: true, push: false, multiplier: 2 })

    expect(
      resolveBaccaratBet('banker', flags({ outcome: 'banker' }), payouts)
    ).toEqual({ won: true, push: false, multiplier: 1.95 })

    expect(
      resolveBaccaratBet('player', flags({ outcome: 'banker' }), payouts)
    ).toEqual({ won: false, push: false, multiplier: 0 })

    expect(
      resolveBaccaratBet('player', flags({ outcome: 'tie' }), payouts)
    ).toEqual({ won: false, push: true, multiplier: 1 })

    expect(
      resolveBaccaratBet('tie', flags({ outcome: 'tie' }), payouts)
    ).toEqual({
      won: true,
      push: false,
      multiplier: 9.5
    })

    expect(
      resolveBaccaratBet('tie', flags({ outcome: 'player' }), payouts)
    ).toEqual({ won: false, push: false, multiplier: 0 })

    expect(
      resolveBaccaratBet('playerPair', flags({ playerPair: true }), payouts)
    ).toEqual({ won: true, push: false, multiplier: 12.5 })

    expect(
      resolveBaccaratBet('playerPair', flags({ playerPair: false }), payouts)
    ).toEqual({ won: false, push: false, multiplier: 0 })

    expect(
      resolveBaccaratBet(
        'bankerPair',
        flags({ outcome: 'tie', bankerPair: true }),
        payouts
      )
    ).toEqual({ won: true, push: false, multiplier: 12.5 })

    expect(
      resolveBaccaratBet(
        'bankerPair',
        flags({ outcome: 'tie', bankerPair: false }),
        payouts
      )
    ).toEqual({ won: false, push: false, multiplier: 0 })

    expect(isValidBaccaratBetSide('bankerPair')).toBe(true)
    expect(isValidBaccaratBetSide('eitherPair')).toBe(true)
    expect(isValidBaccaratBetSide('side')).toBe(false)
  })

  it('resolves either / perfect / big / small sides', () => {
    expect(
      resolveBaccaratBet('eitherPair', flags({ playerPair: true }), payouts)
    ).toEqual({ won: true, push: false, multiplier: 6.5 })

    expect(
      resolveBaccaratBet('eitherPair', flags({ bankerPair: true }), payouts)
    ).toEqual({ won: true, push: false, multiplier: 6.5 })

    expect(resolveBaccaratBet('eitherPair', flags(), payouts)).toEqual({
      won: false,
      push: false,
      multiplier: 0
    })

    expect(
      resolveBaccaratBet(
        'perfectPair',
        flags({ perfectPlayerPair: true }),
        payouts
      )
    ).toEqual({ won: true, push: false, multiplier: 26 })

    expect(
      resolveBaccaratBet(
        'perfectPair',
        flags({ playerPair: true, perfectPlayerPair: false }),
        payouts
      )
    ).toEqual({ won: false, push: false, multiplier: 0 })

    expect(resolveBaccaratBet('big', flags({ cardCount: 5 }), payouts)).toEqual(
      {
        won: true,
        push: false,
        multiplier: 1.55
      }
    )

    expect(resolveBaccaratBet('big', flags({ cardCount: 6 }), payouts)).toEqual(
      {
        won: true,
        push: false,
        multiplier: 1.55
      }
    )

    expect(resolveBaccaratBet('big', flags({ cardCount: 4 }), payouts)).toEqual(
      {
        won: false,
        push: false,
        multiplier: 0
      }
    )

    expect(
      resolveBaccaratBet('small', flags({ cardCount: 4 }), payouts)
    ).toEqual({
      won: true,
      push: false,
      multiplier: 2.5
    })

    expect(
      resolveBaccaratBet('small', flags({ cardCount: 5 }), payouts)
    ).toEqual({
      won: false,
      push: false,
      multiplier: 0
    })
  })

  it('resolves Dragon Bonus and Lucky 6 tiers', () => {
    expect(isNaturalHand([card('9'), card('K')], 9)).toBe(true)
    expect(isNaturalHand([card('4'), card('4'), card('A')], 9)).toBe(false)

    // Natural player win → 1:1 (2x total return)
    expect(
      resolveBaccaratBet(
        'playerDragonBonus',
        flags({
          outcome: 'player',
          playerTotal: 9,
          bankerTotal: 1,
          playerCards: [card('9'), card('K')],
          bankerCards: [card('A'), card('K')]
        }),
        payouts
      )
    ).toEqual({ won: true, push: false, multiplier: 2 })

    // Non-natural win by 9 → 30:1 (31x)
    expect(
      resolveBaccaratBet(
        'playerDragonBonus',
        flags({
          outcome: 'player',
          playerTotal: 9,
          bankerTotal: 0,
          playerCards: [card('4'), card('5'), card('K')],
          bankerCards: [card('K'), card('K'), card('K')],
          cardCount: 6
        }),
        payouts
      )
    ).toEqual({ won: true, push: false, multiplier: 31 })

    // Win by 3 does not pay Dragon Bonus
    expect(
      resolveBaccaratBet(
        'playerDragonBonus',
        flags({
          outcome: 'player',
          playerTotal: 7,
          bankerTotal: 4,
          playerCards: [card('3'), card('4')],
          bankerCards: [card('2'), card('2')],
          cardCount: 4
        }),
        payouts
      )
    ).toEqual({ won: false, push: false, multiplier: 0 })

    // Natural tie pushes Dragon Bonus
    expect(
      resolveBaccaratBet(
        'bankerDragonBonus',
        flags({
          outcome: 'tie',
          playerTotal: 9,
          bankerTotal: 9,
          playerCards: [card('9'), card('K')],
          bankerCards: [card('8'), card('A')]
        }),
        payouts
      )
    ).toEqual({ won: false, push: true, multiplier: 1 })

    // Lucky 6: banker wins with two-card 6
    expect(
      resolveBaccaratBet(
        'lucky6',
        flags({
          outcome: 'banker',
          playerTotal: 4,
          bankerTotal: 6,
          playerCards: [card('2'), card('2')],
          bankerCards: [card('3'), card('3')],
          cardCount: 4
        }),
        payouts
      )
    ).toEqual({ won: true, push: false, multiplier: 13 })

    // Lucky 6: banker wins with three-card 6
    expect(
      resolveBaccaratBet(
        'lucky6',
        flags({
          outcome: 'banker',
          playerTotal: 5,
          bankerTotal: 6,
          playerCards: [card('2'), card('3')],
          bankerCards: [card('2'), card('2'), card('2')],
          cardCount: 5
        }),
        payouts
      )
    ).toEqual({ won: true, push: false, multiplier: 24 })

    expect(
      resolveBaccaratBet(
        'lucky6',
        flags({
          outcome: 'banker',
          playerTotal: 4,
          bankerTotal: 7,
          playerCards: [card('2'), card('2')],
          bankerCards: [card('3'), card('4')],
          cardCount: 4
        }),
        payouts
      )
    ).toEqual({ won: false, push: false, multiplier: 0 })

    // Chosen side loses → Dragon Bonus loses
    expect(
      resolveBaccaratBet(
        'playerDragonBonus',
        flags({
          outcome: 'banker',
          playerTotal: 4,
          bankerTotal: 7,
          playerCards: [card('2'), card('2')],
          bankerCards: [card('3'), card('4')]
        }),
        payouts
      )
    ).toEqual({ won: false, push: false, multiplier: 0 })

    // Non-natural tie loses Dragon Bonus
    expect(
      resolveBaccaratBet(
        'playerDragonBonus',
        flags({
          outcome: 'tie',
          playerTotal: 6,
          bankerTotal: 6,
          playerCards: [card('3'), card('3')],
          bankerCards: [card('2'), card('4')]
        }),
        payouts
      )
    ).toEqual({ won: false, push: false, multiplier: 0 })

    expect(isValidBaccaratBetSide('playerDragonBonus')).toBe(true)
    expect(isValidBaccaratBetSide('lucky6')).toBe(true)
    expect(isBaccaratFlatBetSide('player')).toBe(true)
    expect(isBaccaratFlatBetSide('lucky6')).toBe(false)
  })

  it('sums slip line payouts including push with pairs on the same round', () => {
    const slip = resolveBaccaratSlip(
      [
        { side: 'player', amount: 100 },
        { side: 'playerPair', amount: 20 },
        { side: 'big', amount: 50 }
      ],
      flags({
        outcome: 'tie',
        playerPair: true,
        cardCount: 4
      }),
      payouts
    )

    // player pushes (100), playerPair wins (20 * 12.5), big loses
    expect(slip.totalWinnings).toBe(100 + 20 * 12.5)
    expect(slip.lines[0]).toMatchObject({
      side: 'player',
      push: true,
      winnings: 100
    })
    expect(slip.lines[1]).toMatchObject({
      side: 'playerPair',
      won: true,
      winnings: 250
    })
    expect(slip.lines[2]).toMatchObject({
      side: 'big',
      won: false,
      winnings: 0
    })
  })

  it('keeps side/amount when bet fields are non-enumerable (mongoose-like)', () => {
    const bet = Object.defineProperties(
      {} as { side: 'player'; amount: number },
      {
        side: { get: () => 'player' as const, enumerable: false },
        amount: { get: () => 100, enumerable: false }
      }
    )

    expect({ ...bet }).toEqual({})

    const slip = resolveBaccaratSlip(
      [bet],
      flags({ outcome: 'player' }),
      payouts
    )

    expect(slip.lines[0]).toMatchObject({
      side: 'player',
      amount: 100,
      won: true,
      winnings: 100 * payouts.winMultipliers.player
    })
  })

  it('reports ~98–99% RTP for player/banker defaults', () => {
    const rtp = calculateRTP(
      'baccarat',
      defaultCasinoSettings.baccarat
    ) as Record<string, number>

    expect(rtp.player).toBeGreaterThan(98)
    expect(rtp.player).toBeLessThan(99)
    expect(rtp.banker).toBeGreaterThan(98)
    expect(rtp.banker).toBeLessThan(99.5)
    expect(rtp.tie).toBeGreaterThan(80)
    expect(rtp.playerPair).toBeGreaterThan(80)
    expect(rtp.eitherPair).toBeGreaterThan(80)
    expect(rtp.perfectPair).toBeGreaterThan(80)
    expect(rtp.big).toBeGreaterThan(90)
    expect(rtp.small).toBeGreaterThan(90)
    expect(rtp.playerDragonBonus).toBeGreaterThan(95)
    expect(rtp.playerDragonBonus).toBeLessThan(100)
    expect(rtp.bankerDragonBonus).toBeGreaterThan(85)
    expect(rtp.bankerDragonBonus).toBeLessThan(95)
    expect(rtp.lucky6).toBeGreaterThan(80)
    expect(rtp.lucky6).toBeLessThan(95)
  })
})

describe('mines math', () => {
  const houseEdge = 0.03

  it('computes known fair and payout multipliers', () => {
    // 1 mine, 1 safe: fair = 20/19
    expect(getMinesFairMultiplier(1, 1)).toBeCloseTo(20 / 19, 10)
    expect(getMinesPayoutMultiplier(1, 1, houseEdge)).toBeCloseTo(
      (20 / 19) * 0.97,
      10
    )

    // 3 mines, 2 safe: fair = (20/17) * (19/16)
    expect(getMinesFairMultiplier(3, 2)).toBeCloseTo((20 / 17) * (19 / 16), 10)
    expect(getMinesPayoutMultiplier(3, 2, houseEdge)).toBeCloseTo(
      (20 / 17) * (19 / 16) * 0.97,
      10
    )

    expect(getMinesFairMultiplier(5, 0)).toBe(1)
    expect(getMinesPayoutMultiplier(5, 0, houseEdge)).toBe(0.97)
  })

  it('rejects invalid mine counts and reveal depths', () => {
    expect(getMinesFairMultiplier(0, 1)).toBe(0)
    expect(getMinesFairMultiplier(20, 1)).toBe(0)
    expect(getMinesFairMultiplier(3, 18)).toBe(0)
    expect(getMinesPayoutMultiplier(3, -1, houseEdge)).toBe(0)
  })

  it('validates mine count against settings bounds', () => {
    expect(isValidMineCount(1, 1, 10)).toBe(true)
    expect(isValidMineCount(10, 1, 10)).toBe(true)
    expect(isValidMineCount(0, 1, 10)).toBe(false)
    expect(isValidMineCount(11, 1, 10)).toBe(false)
    expect(isValidMineCount(1.5, 1, 10)).toBe(false)
  })

  it('reports RTP as (1 - houseEdge) * 100 at default edge', () => {
    expect(calculateRTP('mines', defaultCasinoSettings.mines)).toBe(97)
  })
})

describe('casinoSettingsSchema', () => {
  it('accepts default casino settings shape', () => {
    const result = casinoSettingsSchema.safeParse(defaultCasinoSettings)
    expect(result.success).toBe(true)
  })

  it('requires enabled on each playable game', () => {
    const { enabled: _ignored, ...diceWithoutEnabled } =
      defaultCasinoSettings.dice
    const result = casinoSettingsSchema.safeParse({
      ...defaultCasinoSettings,
      dice: diceWithoutEnabled
    })
    expect(result.success).toBe(false)
  })
})
