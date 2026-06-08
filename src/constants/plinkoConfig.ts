import { defaultCasinoSettings } from './defaultConfig'

export const PLINKO_BIN_COUNT = 9
export const PLINKO_ROW_COUNT = PLINKO_BIN_COUNT - 1
export const PLINKO_CENTER_BIN = 5
export const PLINKO_EDITABLE_BINS = [1, 2, 3, 4, 5] as const

export type PlinkoEditableBin = (typeof PLINKO_EDITABLE_BINS)[number]

export type PlinkoBinMultipliers =
  (typeof defaultCasinoSettings)['plinko']['binMultipliers']

export const getPlinkoMirrorBin = (bin: number): number =>
  PLINKO_BIN_COUNT + 1 - bin

export const pathIndexToPlinkoBin = (pathIndex: number): number => pathIndex + 1

export const plinkoBinToPathIndex = (bin: number): number => bin - 1

const toNumber = (val: unknown): number => {
  if (typeof val === 'string') return parseFloat(val) || 0
  if (typeof val === 'number') return val
  return 0
}

const plinkoBinAt = (multipliers: PlinkoBinMultipliers, bin: number): number =>
  multipliers[bin as keyof PlinkoBinMultipliers] ?? 0

const defaultBinMultipliers = (): PlinkoBinMultipliers =>
  defaultCasinoSettings.plinko.binMultipliers

export const expandPlinkoBinMultipliers = (
  editable: Record<string | number, number | string>
): PlinkoBinMultipliers => {
  const defaults = defaultBinMultipliers()
  const result: Record<string, number> = {}

  for (const bin of PLINKO_EDITABLE_BINS) {
    result[String(bin)] = toNumber(
      editable[bin] ?? editable[String(bin)] ?? plinkoBinAt(defaults, bin)
    )
  }

  for (let bin = PLINKO_CENTER_BIN + 1; bin <= PLINKO_BIN_COUNT; bin++) {
    const mirror = getPlinkoMirrorBin(bin)
    result[String(bin)] = result[String(mirror)]!
  }

  return result as PlinkoBinMultipliers
}

/** Migrate legacy 0-indexed bins and enforce symmetric 1–9 layout. */
export const normalizePlinkoBinMultipliers = (
  input: Record<string | number, number | string> | null | undefined
): PlinkoBinMultipliers => {
  if (!input || Object.keys(input).length === 0) {
    return expandPlinkoBinMultipliers(defaultBinMultipliers())
  }

  const raw: Record<number, number> = {}
  for (const [key, value] of Object.entries(input)) {
    const numKey = Number(key)
    if (!Number.isFinite(numKey)) continue
    raw[numKey] = toNumber(value)
  }

  const usesZeroIndex = Object.prototype.hasOwnProperty.call(input, '0')
  const editable: Record<number, number> = {}
  const defaults = defaultBinMultipliers()

  if (usesZeroIndex) {
    for (let bin = 1; bin <= PLINKO_CENTER_BIN; bin++) {
      editable[bin] = raw[bin - 1] ?? plinkoBinAt(defaults, bin)
    }
  } else {
    for (const bin of PLINKO_EDITABLE_BINS) {
      editable[bin] = raw[bin] ?? plinkoBinAt(defaults, bin)
    }
  }

  return expandPlinkoBinMultipliers(editable)
}

export const getPlinkoMultiplierAtPathIndex = (
  binMultipliers: Record<string | number, number | string>,
  pathIndex: number
): number => {
  const normalized = normalizePlinkoBinMultipliers(binMultipliers)
  return plinkoBinAt(normalized, pathIndexToPlinkoBin(pathIndex))
}

export const formatPlinkoBinMultipliersForDisplay = (
  binMultipliers: Record<string | number, number | string>
): Record<string, number> => {
  const normalized = normalizePlinkoBinMultipliers(binMultipliers)
  return Object.fromEntries(
    PLINKO_EDITABLE_BINS.map((bin) => [
      String(bin),
      plinkoBinAt(normalized, bin)
    ])
  )
}
