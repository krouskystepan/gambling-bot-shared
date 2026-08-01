import { DAY_MS, HOUR_MS } from '../../common/durations'

export const MINES_AUTO_RESOLVE_IDLE_DAYS = 1
export const MINES_IDLE_CLOSE_DAYS = 1
export const MINES_IDLE_NUDGE_HOURS = 3

export const minesIdleNudgeThresholdMs = (): number =>
  MINES_IDLE_NUDGE_HOURS * HOUR_MS

export const minesAutoResolveIdleMs = (): number =>
  MINES_AUTO_RESOLVE_IDLE_DAYS * DAY_MS

export const minesIdleCloseMs = (): number => MINES_IDLE_CLOSE_DAYS * DAY_MS

export const hoursUntilMinesAutoResolve = (
  updatedAt: Date,
  nowMs: number = Date.now()
): number => {
  const resolveAt = updatedAt.getTime() + minesAutoResolveIdleMs()
  const hoursLeft = (resolveAt - nowMs) / HOUR_MS
  return Math.max(1, Math.ceil(hoursLeft))
}

export const hoursUntilMinesIdleClose = (
  updatedAt: Date,
  nowMs: number = Date.now()
): number => {
  const closeAt = updatedAt.getTime() + minesIdleCloseMs()
  const hoursLeft = (closeAt - nowMs) / HOUR_MS
  return Math.max(1, Math.ceil(hoursLeft))
}
