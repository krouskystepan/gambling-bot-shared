import { describe, expect, it, vi } from 'vitest'

import { defaultCasinoSettings } from '../../src/casino/constants/defaultConfig'
import type { TCasinoSettings } from '../../src/casino/types/casinoSettings'
import * as calculateRtpModule from '../../src/casino/utils/calculateRTP'
import { runBonusStressTest } from '../../src/dev/bonusStressTest'
import {
  MONTE_CARLO_TARGETS,
  runAllMonteCarloSimulations,
  runMonteCarloSimulation
} from '../../src/dev/casinoMonteCarlo'
import { yieldToEventLoop } from '../../src/dev/yieldToEventLoop'

const stringifiedSettings = {
  ...defaultCasinoSettings,
  dice: { ...defaultCasinoSettings.dice, winMultiplier: '5' },
  coinflip: { ...defaultCasinoSettings.coinflip, winMultiplier: '1.9' },
  goldenJackpot: {
    ...defaultCasinoSettings.goldenJackpot,
    oneInChance: '1000',
    winMultiplier: '500'
  },
  slots: {
    ...defaultCasinoSettings.slots,
    symbolWeights: {
      ...defaultCasinoSettings.slots.symbolWeights,
      '🍒': '35'
    }
  }
} as unknown as TCasinoSettings

describe('yieldToEventLoop', () => {
  it('resolves on the next tick', async () => {
    await yieldToEventLoop()
    expect(true).toBe(true)
  })
})

describe('runMonteCarloSimulation', () => {
  it('returns empirical RTP close to theory for dice', async () => {
    const iterations = 25_000
    const progress: number[] = []
    const result = await runMonteCarloSimulation(
      'dice',
      defaultCasinoSettings,
      iterations,
      (completed, total) => progress.push(completed / total)
    )

    const multiplier = defaultCasinoSettings.dice.winMultiplier
    const winProbability = 1 / 6
    const multiplierVariance =
      winProbability * (1 - winProbability) * multiplier ** 2
    const rtpStandardError =
      Math.sqrt(multiplierVariance / iterations) * 100

    expect(result.theoreticalRtp).toBeGreaterThan(0)
    expect(result.empiricalRtp).toBeGreaterThan(0)
    expect(Math.abs(result.delta ?? 0)).toBeLessThan(rtpStandardError * 5)
    expect(progress.length).toBeGreaterThan(0)
  })

  it('coerces invalid numeric settings to zero', async () => {
    const result = await runMonteCarloSimulation(
      'dice',
      {
        ...defaultCasinoSettings,
        dice: {
          ...defaultCasinoSettings.dice,
          winMultiplier: {} as never
        }
      },
      50
    )

    expect(result.empiricalRtp).toBe(0)
  })

  it('covers coinflip win and loss branches', async () => {
    const random = vi.spyOn(Math, 'random')
    random
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.9)

    const result = await runMonteCarloSimulation(
      'coinflip',
      defaultCasinoSettings,
      2
    )

    expect(result.empiricalRtp).toBeGreaterThan(0)
    expect(result.empiricalRtp).toBeLessThan(
      defaultCasinoSettings.coinflip.winMultiplier * 100
    )
    random.mockRestore()
  })

  it.each([
    'coinflip',
    'slots',
    'lottery',
    'plinko',
    'goldenJackpot',
    'roulette:number',
    'roulette:color',
    'roulette:parity',
    'roulette:range',
    'roulette:dozen',
    'roulette:column'
  ] as const)('simulates %s', async (target) => {
    const result = await runMonteCarloSimulation(
      target,
      stringifiedSettings,
      200
    )

    expect(result.iterations).toBe(200)
    expect(result.empiricalRtp).toBeGreaterThanOrEqual(0)
  })

  it('covers dice win and miss branches', async () => {
    const random = vi.spyOn(Math, 'random')
    random.mockReturnValueOnce(0).mockReturnValueOnce(0)
    random.mockReturnValueOnce(0).mockReturnValueOnce(0.99)

    const result = await runMonteCarloSimulation(
      'dice',
      defaultCasinoSettings,
      2
    )

    expect(result.empiricalRtp).toBeGreaterThan(0)
    expect(result.empiricalRtp).toBeLessThan(
      defaultCasinoSettings.dice.winMultiplier * 100
    )
    random.mockRestore()
  })

  it('covers golden jackpot win and miss branches', async () => {
    const random = vi.spyOn(Math, 'random')
    random.mockReturnValueOnce(0).mockReturnValueOnce(0.99)

    const result = await runMonteCarloSimulation(
      'goldenJackpot',
      defaultCasinoSettings,
      2
    )

    expect(result.empiricalRtp).toBeGreaterThan(0)
    expect(result.empiricalRtp).toBeLessThan(
      defaultCasinoSettings.goldenJackpot.winMultiplier * 100
    )
    random.mockRestore()
  })

  it('covers lottery buckets without configured multipliers', async () => {
    const result = await runMonteCarloSimulation(
      'lottery',
      {
        ...defaultCasinoSettings,
        lottery: {
          ...defaultCasinoSettings.lottery,
          winMultipliers: {
            0: 0
          } as typeof defaultCasinoSettings.lottery.winMultipliers
        }
      },
      200
    )

    expect(result.distribution).toBeDefined()
    expect(result.empiricalRtp).toBe(0)
  })

  it('handles invalid string multipliers', async () => {
    const result = await runMonteCarloSimulation(
      'dice',
      {
        ...defaultCasinoSettings,
        dice: {
          ...defaultCasinoSettings.dice,
          winMultiplier: 'invalid' as unknown as number
        }
      },
      10
    )

    expect(result.empiricalRtp).toBe(0)
  })

  it('handles zero string multipliers', async () => {
    const result = await runMonteCarloSimulation(
      'dice',
      {
        ...defaultCasinoSettings,
        dice: {
          ...defaultCasinoSettings.dice,
          winMultiplier: '0' as unknown as number
        }
      },
      10
    )

    expect(result.empiricalRtp).toBe(0)
  })

  it('handles empty slot symbol weights', async () => {
    const result = await runMonteCarloSimulation(
      'slots',
      {
        ...defaultCasinoSettings,
        slots: {
          ...defaultCasinoSettings.slots,
          symbolWeights: {} as typeof defaultCasinoSettings.slots.symbolWeights
        }
      },
      5
    )

    expect(result.empiricalRtp).toBe(0)
  })

  it('handles zero-weight slot symbols', async () => {
    const result = await runMonteCarloSimulation(
      'slots',
      {
        ...defaultCasinoSettings,
        slots: {
          ...defaultCasinoSettings.slots,
          symbolWeights: {
            '🍒': 0,
            '🫐': 0,
            '🍉': 0,
            '🔔': 0,
            '7️⃣': 0
          }
        }
      },
      5
    )

    expect(result.empiricalRtp).toBeGreaterThanOrEqual(0)
  })

  it('falls back when weighted symbol rolls overflow', async () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(1 - Number.EPSILON)

    const result = await runMonteCarloSimulation(
      'slots',
      defaultCasinoSettings,
      5
    )

    expect(result.empiricalRtp).toBeGreaterThanOrEqual(0)
    random.mockRestore()
  })

  it('handles non-object roulette rtp', async () => {
    const calculateRtp = vi
      .spyOn(calculateRtpModule, 'calculateRTP')
      .mockReturnValue(95)

    const result = await runMonteCarloSimulation(
      'roulette:number',
      defaultCasinoSettings,
      10
    )

    expect(result.theoreticalRtp).toBeNull()
    calculateRtp.mockRestore()
  })

  it('handles missing theoretical rtp values', async () => {
    const calculateRtp = vi
      .spyOn(calculateRtpModule, 'calculateRTP')
      .mockReturnValueOnce(null as never)
      .mockReturnValueOnce({} as never)

    const dice = await runMonteCarloSimulation(
      'dice',
      defaultCasinoSettings,
      10
    )
    const roulette = await runMonteCarloSimulation(
      'roulette:number',
      defaultCasinoSettings,
      10
    )

    expect(dice.theoreticalRtp).toBeNull()
    expect(dice.delta).toBeNull()
    expect(roulette.theoreticalRtp).toBeNull()
    calculateRtp.mockRestore()
  })

  it('runs every configured target', async () => {
    const progress: number[] = []
    const results = await runAllMonteCarloSimulations(
      defaultCasinoSettings,
      100,
      (completed, total) => progress.push(completed / total)
    )

    expect(results).toHaveLength(MONTE_CARLO_TARGETS.length)
    expect(progress.length).toBeGreaterThan(0)
  })
})

describe('runBonusStressTest', () => {
  it('summarizes streak rewards', async () => {
    const progress: number[] = []
    const result = await runBonusStressTest(
      {
        rewardMode: 'linear',
        baseReward: 10,
        streakIncrement: 5,
        maxReward: 100,
        resetOnMax: true,
        milestoneBonus: { weekly: 20, monthly: 50 }
      },
      30,
      (completed, total) => progress.push(completed / total)
    )

    expect(result.days).toBe(30)
    expect(result.totalReward).toBeGreaterThan(0)
    expect(result.preview).toHaveLength(30)
    expect(progress.length).toBeGreaterThan(0)
  })

  it('handles zero-day runs', async () => {
    const result = await runBonusStressTest(
      {
        rewardMode: 'exponential',
        baseReward: 10,
        streakMultiplier: 1.5,
        maxReward: 0,
        resetOnMax: false,
        milestoneBonus: { weekly: 0, monthly: 0 }
      },
      0
    )

    expect(result.days).toBe(0)
    expect(result.avgReward).toBe(0)
    expect(result.preview).toHaveLength(0)
  })
})
