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
  baccaratCardValue,
  baccaratIdleNudgeThresholdMs,
  baccaratIdleRefundMs,
  blackjackAutostandIdleMs,
  blackjackIdleNudgeThresholdMs,
  calculateRTP,
  casinoSettingsSchema,
  dealBaccaratRound,
  defaultCasinoSettings,
  expandPlinkoBinMultipliers,
  formatPlinkoBinMultipliersForDisplay,
  getHiloTimeoutRefund,
  getHiloWinMultiplier,
  getMinesFairMultiplier,
  getMinesPayoutMultiplier,
  getPlinkoMirrorBin,
  getPlinkoMultiplierAtPathIndex,
  handTotal,
  hiloRankFromLabel,
  hoursUntilBaccaratIdleRefund,
  hoursUntilBlackjackAutostand,
  hoursUntilMinesAutoResolve,
  isLimboWin,
  isPair,
  isValidBaccaratBetSide,
  isValidLimboTarget,
  isValidMineCount,
  limboHitProbability,
  minesAutoResolveIdleMs,
  minesIdleNudgeThresholdMs,
  normalizeCasinoSettings,
  normalizePlinkoBinMultipliers,
  pathIndexToPlinkoBin,
  plinkoBinToPathIndex,
  resolveBaccaratBet,
  resolveHiloRound,
  rollLimboResult,
  shouldAnnounceByMultiplier,
  shouldAnnounceGoldenJackpotHit,
  shouldAnnouncePlinkoBall,
  shouldBankerDrawThird,
  shouldPlayerDrawThird,
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
    expect(calculateRTP('baccarat', defaultCasinoSettings.baccarat)).toEqual(
      expect.objectContaining({
        player: expect.any(Number),
        banker: expect.any(Number),
        tie: expect.any(Number),
        playerPair: expect.any(Number),
        bankerPair: expect.any(Number)
      })
    )
    expect(calculateRTP('rps', defaultCasinoSettings.rps)).toBeGreaterThan(0)
    expect(
      calculateRTP('goldenJackpot', defaultCasinoSettings.goldenJackpot)
    ).toBeGreaterThan(0)
    expect(
      calculateRTP('raffle', defaultCasinoSettings.raffle)
    ).toBeGreaterThan(0)
    expect(
      calculateRTP('blackjack', defaultCasinoSettings.blackjack)
    ).toBeCloseTo(99.5, 5)
    expect(
      calculateRTP('blackjack', {
        ...defaultCasinoSettings.blackjack,
        winMultipliers: { win: 1.8, blackjack: 2, push: 1 }
      })
    ).toBeLessThan(99.5)
    expect(
      calculateRTP('blackjack', {
        maxBet: 0,
        minBet: 0
      } as never)
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

  it('computes hours until baccarat idle refund', () => {
    const now = Date.parse('2024-06-15T12:00:00Z')
    const updatedAt = new Date(now - 6 * 60 * 60 * 1000)

    expect(hoursUntilBaccaratIdleRefund(updatedAt, now)).toBe(18)
    expect(
      hoursUntilBaccaratIdleRefund(new Date(now - 23 * 60 * 60 * 1000), now)
    ).toBe(1)
    expect(baccaratIdleNudgeThresholdMs()).toBe(3 * 60 * 60 * 1000)
    expect(baccaratIdleRefundMs()).toBe(24 * 60 * 60 * 1000)
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

  it('includes baccarat in casino game ids and record fields', () => {
    expect(CASINO_GAME_IDS).toContain('baccarat')
    expect(GAME_RECORD_FIELDS.baccarat).toContain('winMultipliers')
  })

  it('includes blackjack winMultipliers in record fields', () => {
    expect(GAME_RECORD_FIELDS.blackjack).toContain('winMultipliers')
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

describe('getHiloTimeoutRefund', () => {
  it('refunds 90% when timeout fee is 10%', () => {
    expect(getHiloTimeoutRefund(1000, 0.1)).toBe(900)
  })

  it('refunds the full bet when fee is 0', () => {
    expect(getHiloTimeoutRefund(1000, 0)).toBe(1000)
  })

  it('refunds nothing when fee is 1', () => {
    expect(getHiloTimeoutRefund(1000, 1)).toBe(0)
  })

  it('clamps out-of-range fees', () => {
    expect(getHiloTimeoutRefund(1000, -0.5)).toBe(1000)
    expect(getHiloTimeoutRefund(1000, 1.5)).toBe(0)
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
  const mult = defaultCasinoSettings.baccarat.winMultipliers

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
  })

  it('resolves main bets with push on tie and pair sides', () => {
    expect(
      resolveBaccaratBet(
        'player',
        { outcome: 'player', playerPair: false, bankerPair: false },
        mult
      )
    ).toEqual({ won: true, push: false, multiplier: 2 })

    expect(
      resolveBaccaratBet(
        'banker',
        { outcome: 'banker', playerPair: false, bankerPair: false },
        mult
      )
    ).toEqual({ won: true, push: false, multiplier: 1.95 })

    expect(
      resolveBaccaratBet(
        'player',
        { outcome: 'banker', playerPair: false, bankerPair: false },
        mult
      )
    ).toEqual({ won: false, push: false, multiplier: 0 })

    expect(
      resolveBaccaratBet(
        'player',
        { outcome: 'tie', playerPair: false, bankerPair: false },
        mult
      )
    ).toEqual({ won: false, push: true, multiplier: 1 })

    expect(
      resolveBaccaratBet(
        'tie',
        { outcome: 'tie', playerPair: false, bankerPair: false },
        mult
      )
    ).toEqual({ won: true, push: false, multiplier: 9 })

    expect(
      resolveBaccaratBet(
        'tie',
        { outcome: 'player', playerPair: false, bankerPair: false },
        mult
      )
    ).toEqual({ won: false, push: false, multiplier: 0 })

    expect(
      resolveBaccaratBet(
        'playerPair',
        { outcome: 'banker', playerPair: true, bankerPair: false },
        mult
      )
    ).toEqual({ won: true, push: false, multiplier: 12 })

    expect(
      resolveBaccaratBet(
        'playerPair',
        { outcome: 'player', playerPair: false, bankerPair: false },
        mult
      )
    ).toEqual({ won: false, push: false, multiplier: 0 })

    expect(
      resolveBaccaratBet(
        'bankerPair',
        { outcome: 'tie', playerPair: false, bankerPair: true },
        mult
      )
    ).toEqual({ won: true, push: false, multiplier: 12 })

    expect(
      resolveBaccaratBet(
        'bankerPair',
        { outcome: 'tie', playerPair: false, bankerPair: false },
        mult
      )
    ).toEqual({ won: false, push: false, multiplier: 0 })

    expect(isValidBaccaratBetSide('bankerPair')).toBe(true)
    expect(isValidBaccaratBetSide('side')).toBe(false)
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
