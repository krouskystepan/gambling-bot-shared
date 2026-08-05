import { DAY_MS, HOUR_MS } from '../../common/durations'

/** Same idle window as slots: nudge at 3h, close at 1 day. */
export const PLINKO_IDLE_CLOSE_DAYS = 1
export const PLINKO_IDLE_NUDGE_HOURS = 3

export const plinkoIdleNudgeThresholdMs = (): number =>
  PLINKO_IDLE_NUDGE_HOURS * HOUR_MS

export const plinkoIdleCloseMs = (): number => PLINKO_IDLE_CLOSE_DAYS * DAY_MS

export const hoursUntilPlinkoIdleClose = (
  updatedAt: Date,
  nowMs: number = Date.now()
): number => {
  const closeAt = updatedAt.getTime() + plinkoIdleCloseMs()
  const hoursLeft = (closeAt - nowMs) / HOUR_MS
  return Math.max(1, Math.ceil(hoursLeft))
}
