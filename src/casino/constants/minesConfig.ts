/** Fixed Mines board size (not admin-configurable). */
export const MINES_COLS = 5
export const MINES_ROWS = 4
export const MINES_CELL_COUNT = MINES_COLS * MINES_ROWS

/** Absolute bounds: at least 1 mine, at least 1 safe cell. */
export const MINES_ABSOLUTE_MIN = 1
export const MINES_ABSOLUTE_MAX = MINES_CELL_COUNT - 1

export const isValidMineCount = (
  mineCount: number,
  minMines: number,
  maxMines: number
): boolean =>
  Number.isInteger(mineCount) &&
  mineCount >= Math.max(MINES_ABSOLUTE_MIN, minMines) &&
  mineCount <= Math.min(MINES_ABSOLUTE_MAX, maxMines)

/**
 * Fair (zero-edge) multiplier after `safeReveals` successful picks.
 * fair(k) = Π_{i=0}^{k-1} (n - i) / (n - m - i)
 */
export const getMinesFairMultiplier = (
  mineCount: number,
  safeReveals: number,
  cellCount: number = MINES_CELL_COUNT
): number => {
  if (
    !Number.isInteger(mineCount) ||
    !Number.isInteger(safeReveals) ||
    mineCount < MINES_ABSOLUTE_MIN ||
    mineCount > MINES_ABSOLUTE_MAX ||
    safeReveals < 0 ||
    safeReveals > cellCount - mineCount
  ) {
    return 0
  }

  if (safeReveals === 0) return 1

  let fair = 1
  for (let i = 0; i < safeReveals; i++) {
    fair *= (cellCount - i) / (cellCount - mineCount - i)
  }
  return fair
}

/**
 * House payout multiplier after `safeReveals` picks:
 * payout(k) = fair(k) * (1 - houseEdge)
 */
export const getMinesPayoutMultiplier = (
  mineCount: number,
  safeReveals: number,
  houseEdge: number,
  cellCount: number = MINES_CELL_COUNT
): number => {
  const fair = getMinesFairMultiplier(mineCount, safeReveals, cellCount)
  if (fair <= 0) return 0
  return fair * (1 - houseEdge)
}
