import { DAY_MS, HOUR_MS } from '../../common/durations'

/** Same idle window as baccarat: nudge at 3h, close at 1 day. */
export const ROULETTE_IDLE_CLOSE_DAYS = 1
export const ROULETTE_IDLE_NUDGE_HOURS = 3

export const rouletteIdleNudgeThresholdMs = (): number =>
  ROULETTE_IDLE_NUDGE_HOURS * HOUR_MS

export const rouletteIdleCloseMs = (): number =>
  ROULETTE_IDLE_CLOSE_DAYS * DAY_MS

export const hoursUntilRouletteIdleClose = (
  updatedAt: Date,
  nowMs: number = Date.now()
): number => {
  const closeAt = updatedAt.getTime() + rouletteIdleCloseMs()
  const hoursLeft = (closeAt - nowMs) / HOUR_MS
  return Math.max(1, Math.ceil(hoursLeft))
}
