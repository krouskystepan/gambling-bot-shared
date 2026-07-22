import {
  CASINO_GAME_IDS,
  COINFLIP_MAX_SIMULATE_FLIPS,
  DICE_MAX_SIMULATE_ROLLS,
  GAME_RECORD_FIELDS,
  GOLDEN_JACKPOT_MAX_SIMULATE_ENTRIES,
  LOTTERY_MAX_SIMULATE_ENTRIES,
  SLOT_MAX_SIMULATE_SPINS,
  SUITES,
  VALUES,
  blackjackAutostandIdleMs,
  blackjackIdleNudgeThresholdMs,
  calculateRTP,
  casinoSettingsSchema,
  defaultCasinoSettings,
  expandPlinkoBinMultipliers,
  formatPlinkoBinMultipliersForDisplay,
  getHiloWinMultiplier,
  getMinesFairMultiplier,
  getMinesPayoutMultiplier,
  getPlinkoMirrorBin,
  getPlinkoMultiplierAtPathIndex,
  hiloRankFromLabel,
  hoursUntilBlackjackAutostand,
  hoursUntilMinesAutoResolve,
  isLimboWin,
  isValidLimboTarget,
  isValidMineCount,
  limboHitProbability,
  minesAutoResolveIdleMs,
  minesIdleNudgeThresholdMs,
  normalizeCasinoSettings,
  normalizePlinkoBinMultipliers,
  pathIndexToPlinkoBin,
  plinkoBinToPathIndex,
  resolveHiloRound,
  rollLimboResult,
  shouldAnnounceByMultiplier,
  shouldAnnounceGoldenJackpotHit,
  shouldAnnouncePlinkoBall,
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
})

describe('calculateRTP', () => {
  it('computes RTP for each casino game', () => {
    expect(calculateRTP('dice', defaultCasinoSettings.dice)).toBeGreaterThan(0)
    expect(calculateRTP('coinflip', defaultCasinoSettings.coinflip)).toBe(95)
    expect(calculateRTP('hilo', defaultCasinoSettings.hilo)).toBeCloseTo(
      (1 - 0.03 * (48 / 51)) * 100,
      5
    )
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
    expect(calculateRTP('rps', defaultCasinoSettings.rps)).toBeGreaterThan(0)
    expect(
      calculateRTP('goldenJackpot', defaultCasinoSettings.goldenJackpot)
    ).toBeGreaterThan(0)
    expect(
      calculateRTP('raffle', defaultCasinoSettings.raffle)
    ).toBeGreaterThan(0)
    expect(calculateRTP('blackjack', defaultCasinoSettings.blackjack)).toBe(0)
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

  it('computes hours until mines auto-resolve', () => {
    const now = Date.parse('2024-06-15T12:00:00Z')
    const updatedAt = new Date(now - 6 * 60 * 60 * 1000)

    expect(hoursUntilMinesAutoResolve(updatedAt, now)).toBe(18)
    expect(
      hoursUntilMinesAutoResolve(new Date(now - 23 * 60 * 60 * 1000), now)
    ).toBe(1)
  })

  it('includes mines in casino game ids', () => {
    expect(CASINO_GAME_IDS).toContain('mines')
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
  it('pays void-style odds with house edge on a single deck', () => {
    // Middle card (8): 24 higher, 24 lower → mult = 0.97 * 48 / 24
    expect(getHiloWinMultiplier(8, 'higher', 0.03)).toBeCloseTo(1.94, 5)
    expect(getHiloWinMultiplier(8, 'lower', 0.03)).toBeCloseTo(1.94, 5)
    // King: 4 aces higher, 44 lower
    expect(getHiloWinMultiplier(13, 'higher', 0.03)).toBeCloseTo(
      (0.97 * 48) / 4,
      5
    )
    expect(getHiloWinMultiplier(13, 'lower', 0.03)).toBeCloseTo(
      (0.97 * 48) / 44,
      5
    )
    expect(getHiloWinMultiplier(14, 'higher', 0.03)).toBeNull()
    expect(getHiloWinMultiplier(2, 'lower', 0.03)).toBeNull()
  })

  it('resolves win lose push', () => {
    expect(resolveHiloRound(8, 10, 'higher')).toBe('win')
    expect(resolveHiloRound(8, 5, 'higher')).toBe('lose')
    expect(resolveHiloRound(8, 8, 'higher')).toBe('push')
    expect(resolveHiloRound(8, 5, 'lower')).toBe('win')
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
})
