/** Target multiplier bounds (not admin-configurable). */
export const LIMBO_MIN_TARGET = 1.01
export const LIMBO_MAX_TARGET = 1_000_000

export const limboHitProbability = (
  target: number,
  houseEdge: number
): number => (1 - houseEdge) / target

/** Round limbo multipliers to 2 decimals for display and win checks. */
export const roundLimboMultiplier = (value: number): number =>
  Math.round(value * 100) / 100

/**
 * Roll a limbo result multiplier.
 * `random01` must be uniform in (0, 1]; values outside are clamped.
 * Win check and display use the same 2-decimal rounded value.
 */
export const rollLimboResult = (
  houseEdge: number,
  random01: number
): number => {
  const u = Math.min(1, Math.max(Number.EPSILON, random01))
  const raw = (1 - houseEdge) / u
  return Math.max(1, roundLimboMultiplier(raw))
}

export const isLimboWin = (result: number, target: number): boolean =>
  result >= target

export const isValidLimboTarget = (target: number): boolean =>
  Number.isFinite(target) &&
  target >= LIMBO_MIN_TARGET &&
  target <= LIMBO_MAX_TARGET
