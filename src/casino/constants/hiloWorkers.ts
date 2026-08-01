import { HOUR_MS, MINUTE_MS } from '../../common/durations'

/** How long a player has to guess before the timeout fee is applied. */
export const HILO_GUESS_TIMEOUT_MS = 1 * HOUR_MS

/** DM reminder after this idle time (halfway through the timeout window). */
export const HILO_IDLE_NUDGE_MS = 30 * MINUTE_MS

export const hiloGuessTimeoutMs = (): number => HILO_GUESS_TIMEOUT_MS

export const hiloIdleNudgeThresholdMs = (): number => HILO_IDLE_NUDGE_MS

/** Minutes left until timeout fee, for nudge copy. */
export const minutesUntilHiloTimeout = (
  createdAt: Date,
  nowMs: number = Date.now()
): number => {
  const timeoutAt = createdAt.getTime() + hiloGuessTimeoutMs()
  const minutesLeft = (timeoutAt - nowMs) / MINUTE_MS
  return Math.max(1, Math.ceil(minutesLeft))
}
