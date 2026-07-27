import { DAY_MS, HOUR_MS } from '../../common/durations'

/** Same idle window as roulette: nudge at 3h, close at 1 day. */
export const SLOTS_IDLE_CLOSE_DAYS = 1
export const SLOTS_IDLE_NUDGE_HOURS = 3

export const slotsIdleNudgeThresholdMs = (): number =>
  SLOTS_IDLE_NUDGE_HOURS * HOUR_MS

export const slotsIdleCloseMs = (): number => SLOTS_IDLE_CLOSE_DAYS * DAY_MS

export const hoursUntilSlotsIdleClose = (
  updatedAt: Date,
  nowMs: number = Date.now()
): number => {
  const closeAt = updatedAt.getTime() + slotsIdleCloseMs()
  const hoursLeft = (closeAt - nowMs) / HOUR_MS
  return Math.max(1, Math.ceil(hoursLeft))
}
