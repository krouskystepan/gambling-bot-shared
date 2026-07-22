import { DAY_MS, HOUR_MS } from '../../common/durations'

export const BLACKJACK_AUTOSTAND_IDLE_DAYS = 1
export const BLACKJACK_IDLE_NUDGE_HOURS = 3

export const blackjackIdleNudgeThresholdMs = (): number =>
  BLACKJACK_IDLE_NUDGE_HOURS * HOUR_MS

export const blackjackAutostandIdleMs = (): number =>
  BLACKJACK_AUTOSTAND_IDLE_DAYS * DAY_MS

export const hoursUntilBlackjackAutostand = (
  updatedAt: Date,
  nowMs: number = Date.now()
): number => {
  const autostandAt = updatedAt.getTime() + blackjackAutostandIdleMs()
  const hoursLeft = (autostandAt - nowMs) / HOUR_MS
  return Math.max(1, Math.ceil(hoursLeft))
}
