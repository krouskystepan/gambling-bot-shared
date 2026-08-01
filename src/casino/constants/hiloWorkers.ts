import { DAY_MS, HOUR_MS, MINUTE_MS } from '../../common/durations'

/** How long a player has to guess before the safest side is auto-played. */
export const HILO_GUESS_TIMEOUT_MS = 1 * HOUR_MS

/** DM reminder after this idle time (halfway through the timeout window). */
export const HILO_IDLE_NUDGE_MS = 30 * MINUTE_MS

/** Close abandoned BETTING / RESULT tables after this many days. */
export const HILO_IDLE_CLOSE_DAYS = 1

export const hiloGuessTimeoutMs = (): number => HILO_GUESS_TIMEOUT_MS

export const hiloIdleNudgeThresholdMs = (): number => HILO_IDLE_NUDGE_MS

export const hiloIdleCloseMs = (): number => HILO_IDLE_CLOSE_DAYS * DAY_MS

/** Minutes left until auto-play, for nudge copy. */
export const minutesUntilHiloTimeout = (
  waitingSince: Date,
  nowMs: number = Date.now()
): number => {
  const timeoutAt = waitingSince.getTime() + hiloGuessTimeoutMs()
  const minutesLeft = (timeoutAt - nowMs) / MINUTE_MS
  return Math.max(1, Math.ceil(minutesLeft))
}
