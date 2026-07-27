import { defaultCasinoSettings } from '../constants'
import { normalizePlinkoBinMultipliers } from '../constants/plinkoConfig'
import type { TCasinoSettings } from '../types/casinoSettings'

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const deepMerge = <T extends Record<string, unknown>>(
  base: T,
  patch: Record<string, unknown> | null | undefined
): T => {
  if (!patch) return { ...base }

  const result = { ...base }

  for (const [key, patchValue] of Object.entries(patch)) {
    const baseValue = base[key]

    if (isPlainObject(baseValue) && isPlainObject(patchValue)) {
      result[key as keyof T] = deepMerge(baseValue, patchValue) as T[keyof T]
      continue
    }

    if (patchValue !== undefined) {
      result[key as keyof T] = patchValue as T[keyof T]
    }
  }

  return result
}

/** Prefer `houseEdge`; fall back to legacy `casinoCut` from stored guild settings. */
const resolveHouseEdge = (
  rawGame: Record<string, unknown> | undefined,
  fallback: number
): number => {
  if (typeof rawGame?.houseEdge === 'number') return rawGame.houseEdge
  if (typeof rawGame?.casinoCut === 'number') return rawGame.casinoCut
  return fallback
}

export const normalizeCasinoSettings = (
  settings: Partial<TCasinoSettings> | null | undefined
): TCasinoSettings => {
  const raw = settings as
    | {
        rps?: Record<string, unknown>
        raffle?: Record<string, unknown>
      }
    | null
    | undefined

  const merged = deepMerge(
    defaultCasinoSettings as Record<string, unknown>,
    settings as Record<string, unknown> | null | undefined
  ) as TCasinoSettings

  return {
    ...merged,
    rps: {
      houseEdge: resolveHouseEdge(
        raw?.rps,
        defaultCasinoSettings.rps.houseEdge
      ),
      maxBet: merged.rps.maxBet,
      minBet: merged.rps.minBet
    },
    raffle: {
      houseEdge: resolveHouseEdge(
        raw?.raffle,
        defaultCasinoSettings.raffle.houseEdge
      )
    },
    plinko: {
      ...merged.plinko,
      binMultipliers: normalizePlinkoBinMultipliers(
        merged.plinko.binMultipliers
      )
    }
  }
}
