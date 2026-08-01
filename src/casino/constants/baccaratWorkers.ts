import { DAY_MS, HOUR_MS } from '../../common/durations'

/** Same idle window as blackjack: nudge at 3h, idle-close at 1 day. */
export const BACCARAT_IDLE_CLOSE_DAYS = 1
export const BACCARAT_IDLE_NUDGE_HOURS = 3

export const baccaratIdleNudgeThresholdMs = (): number =>
  BACCARAT_IDLE_NUDGE_HOURS * HOUR_MS

export const baccaratIdleCloseMs = (): number =>
  BACCARAT_IDLE_CLOSE_DAYS * DAY_MS

export const hoursUntilBaccaratIdleClose = (
  updatedAt: Date,
  nowMs: number = Date.now()
): number => {
  const closeAt = updatedAt.getTime() + baccaratIdleCloseMs()
  const hoursLeft = (closeAt - nowMs) / HOUR_MS
  return Math.max(1, Math.ceil(hoursLeft))
}
