import { defaultCasinoSettings } from '../constants'
import { normalizePlinkoBinMultipliers } from '../constants/plinkoConfig'
import type { TCasinoSettings } from '../types'

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

export const normalizeCasinoSettings = (
  settings: Partial<TCasinoSettings> | null | undefined
): TCasinoSettings => {
  const merged = deepMerge(
    defaultCasinoSettings as Record<string, unknown>,
    settings as Record<string, unknown> | null | undefined
  ) as TCasinoSettings

  return {
    ...merged,
    plinko: {
      ...merged.plinko,
      binMultipliers: normalizePlinkoBinMultipliers(
        merged.plinko.binMultipliers
      )
    }
  }
}
