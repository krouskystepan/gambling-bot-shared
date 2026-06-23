import {
  LOTTERY_NUM_TO_DRAW,
  LOTTERY_TOTAL_NUMBERS
} from '../casino/constants/lotteryConfig'
import { PLINKO_ROW_COUNT } from '../casino/constants/plinkoConfig'
import {
  getPlinkoMultiplierAtPathIndex,
  normalizePlinkoBinMultipliers
} from '../casino/constants/plinkoConfig'
import { MINI_NUMBERS } from '../casino/constants/rouletteConfig'
import type { TCasinoSettings } from '../casino/types/casinoSettings'
import { calculateRTP } from '../casino/utils/calculateRTP'
import {
  type RouletteBet,
  type RouletteBetType,
  calculateRouletteWin
} from '../casino/utils/calculateRouletteWin'
import { yieldToEventLoop } from './yieldToEventLoop'

const toNumber = (val: unknown): number => {
  if (typeof val === 'string') return parseFloat(val) || 0
  if (typeof val === 'number') return val
  return 0
}

const ROULETTE_NUMBERS = Object.keys(MINI_NUMBERS)

const ROULETTE_BET_TYPES: RouletteBetType[] = [
  'number',
  'color',
  'parity',
  'range',
  'dozen',
  'column'
]

const ROULETTE_REP_BETS: Record<RouletteBetType, RouletteBet> = {
  number: { type: 'number', value: '1', amount: 1 },
  color: { type: 'color', value: 'red', amount: 1 },
  parity: { type: 'parity', value: 'even', amount: 1 },
  range: { type: 'range', value: 'low', amount: 1 },
  dozen: { type: 'dozen', value: '1', amount: 1 },
  column: { type: 'column', value: '2', amount: 1 }
}

export type MonteCarloTarget =
  | 'dice'
  | 'coinflip'
  | 'slots'
  | 'lottery'
  | 'plinko'
  | 'goldenJackpot'
  | `roulette:${RouletteBetType}`

export const MONTE_CARLO_TARGETS: MonteCarloTarget[] = [
  'dice',
  'coinflip',
  'slots',
  'lottery',
  'plinko',
  'goldenJackpot',
  ...ROULETTE_BET_TYPES.map((type) => `roulette:${type}` as const)
]

export type MonteCarloResult = {
  target: MonteCarloTarget
  label: string
  iterations: number
  theoreticalRtp: number | null
  empiricalRtp: number
  delta: number | null
  elapsedMs: number
  distribution?: Record<string, number>
}

const drawUnique = (count: number, max: number): number[] => {
  const pool = Array.from({ length: max }, (_, index) => index + 1)
  const picks: number[] = []

  for (let i = 0; i < count; i++) {
    const index = Math.floor(Math.random() * pool.length)
    picks.push(pool[index]!)
    pool.splice(index, 1)
  }

  return picks
}

const pickWeightedSymbol = (
  weights: Record<string, number | string>
): string => {
  const entries = Object.entries(weights)
  const total = entries.reduce((sum, [, weight]) => sum + toNumber(weight), 0)
  let roll = Math.random() * total
  let selected = entries[entries.length - 1]?.[0] ?? ''

  for (const [symbol, weight] of entries) {
    roll -= toNumber(weight)
    if (roll <= 0) {
      selected = symbol
      break
    }
  }

  return selected
}

const spinSlots = (settings: TCasinoSettings['slots']): number => {
  const combo = Array.from({ length: 3 }, () =>
    pickWeightedSymbol(settings.symbolWeights)
  ).join('')
  return toNumber(
    (settings.winMultipliers as Record<string, number>)[combo] ?? 0
  )
}

const spinRoulette = (): string =>
  ROULETTE_NUMBERS[Math.floor(Math.random() * ROULETTE_NUMBERS.length)]!

const simulateRound = (
  target: MonteCarloTarget,
  settings: TCasinoSettings
): { multiplier: number; bucket?: string } => {
  switch (target) {
    case 'dice': {
      const rolled = Math.floor(Math.random() * 6) + 1
      const guessed = Math.floor(Math.random() * 6) + 1
      return {
        multiplier:
          rolled === guessed ? toNumber(settings.dice.winMultiplier) : 0
      }
    }
    case 'coinflip': {
      const flipped = Math.random() < 0.5 ? 'heads' : 'tails'
      const picked = Math.random() < 0.5 ? 'heads' : 'tails'
      return {
        multiplier:
          flipped === picked ? toNumber(settings.coinflip.winMultiplier) : 0
      }
    }
    case 'slots':
      return { multiplier: spinSlots(settings.slots) }
    case 'lottery': {
      const picks = drawUnique(LOTTERY_NUM_TO_DRAW, LOTTERY_TOTAL_NUMBERS)
      const drawn = drawUnique(LOTTERY_NUM_TO_DRAW, LOTTERY_TOTAL_NUMBERS)
      const matched = picks.filter((pick) => drawn.includes(pick)).length
      return {
        multiplier: toNumber(
          (settings.lottery.winMultipliers as Record<number, number>)[
            matched
          ] ?? 0
        ),
        bucket: String(matched)
      }
    }
    case 'plinko': {
      let rights = 0
      for (let row = 0; row < PLINKO_ROW_COUNT; row++) {
        if (Math.random() < 0.5) rights++
      }
      const multipliers = normalizePlinkoBinMultipliers(
        settings.plinko.binMultipliers
      )
      return {
        multiplier: getPlinkoMultiplierAtPathIndex(multipliers, rights),
        bucket: String(rights)
      }
    }
    case 'goldenJackpot': {
      const chance = Math.max(1, toNumber(settings.goldenJackpot.oneInChance))
      const won = Math.floor(Math.random() * chance) === 0
      return {
        multiplier: won ? toNumber(settings.goldenJackpot.winMultiplier) : 0
      }
    }
    default: {
      const betType = target.replace('roulette:', '') as RouletteBetType
      const result = spinRoulette()
      return {
        multiplier: calculateRouletteWin(
          ROULETTE_REP_BETS[betType],
          result,
          settings.roulette.winMultipliers
        )
      }
    }
  }
}

const getTheoreticalRtp = (
  target: MonteCarloTarget,
  settings: TCasinoSettings
): number | null => {
  if (target.startsWith('roulette:')) {
    const betType = target.replace('roulette:', '') as RouletteBetType
    const rtp = calculateRTP('roulette', settings.roulette)
    if (typeof rtp !== 'object') return null
    return rtp[betType] ?? null
  }

  const game = target as
    | 'dice'
    | 'coinflip'
    | 'slots'
    | 'lottery'
    | 'plinko'
    | 'goldenJackpot'
  const rtp = calculateRTP(game, settings[game])
  return typeof rtp === 'number' ? rtp : null
}

const targetLabel = (target: MonteCarloTarget): string => {
  if (target.startsWith('roulette:')) {
    return `Roulette · ${target.replace('roulette:', '')}`
  }

  const labels: Record<
    Exclude<MonteCarloTarget, `roulette:${string}`>,
    string
  > = {
    dice: 'Dice',
    coinflip: 'Coin flip',
    slots: 'Slots',
    lottery: 'Lottery',
    plinko: 'Plinko',
    goldenJackpot: 'Golden jackpot'
  }

  return labels[target as keyof typeof labels]
}

export async function runMonteCarloSimulation(
  target: MonteCarloTarget,
  settings: TCasinoSettings,
  iterations: number,
  onProgress?: (completed: number, total: number) => void,
  chunkSize = 25_000
): Promise<MonteCarloResult> {
  const started = performance.now()
  let totalMultiplier = 0
  const distribution: Record<string, number> = {}
  let completed = 0

  while (completed < iterations) {
    const batch = Math.min(chunkSize, iterations - completed)

    for (let i = 0; i < batch; i++) {
      const round = simulateRound(target, settings)
      totalMultiplier += round.multiplier

      if (round.bucket) {
        distribution[round.bucket] = (distribution[round.bucket] ?? 0) + 1
      }
    }

    completed += batch
    onProgress?.(completed, iterations)
    await yieldToEventLoop()
  }

  const empiricalRtp = (totalMultiplier / iterations) * 100
  const theoreticalRtp = getTheoreticalRtp(target, settings)
  const delta = theoreticalRtp == null ? null : empiricalRtp - theoreticalRtp

  return {
    target,
    label: targetLabel(target),
    iterations,
    theoreticalRtp,
    empiricalRtp,
    delta,
    elapsedMs: Math.round(performance.now() - started),
    distribution:
      Object.keys(distribution).length > 0 ? distribution : undefined
  }
}

export async function runAllMonteCarloSimulations(
  settings: TCasinoSettings,
  iterations: number,
  onProgress?: (completed: number, total: number) => void
): Promise<MonteCarloResult[]> {
  const results: MonteCarloResult[] = []
  const total = MONTE_CARLO_TARGETS.length

  for (let index = 0; index < MONTE_CARLO_TARGETS.length; index++) {
    const target = MONTE_CARLO_TARGETS[index]!
    const result = await runMonteCarloSimulation(
      target,
      settings,
      iterations,
      (completed, targetIterations) => {
        onProgress?.(index + completed / targetIterations, total)
      }
    )
    results.push(result)
  }

  onProgress?.(total, total)
  return results
}
