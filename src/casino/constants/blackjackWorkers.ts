export const BLACKJACK_AUTOSTAND_IDLE_DAYS = 1
export const BLACKJACK_IDLE_NUDGE_HOURS = 3

const MS_PER_HOUR = 60 * 60 * 1000
const MS_PER_DAY = 24 * MS_PER_HOUR

export const blackjackIdleNudgeThresholdMs = (): number =>
  BLACKJACK_IDLE_NUDGE_HOURS * MS_PER_HOUR

export const blackjackAutostandIdleMs = (): number =>
  BLACKJACK_AUTOSTAND_IDLE_DAYS * MS_PER_DAY

export const hoursUntilBlackjackAutostand = (
  updatedAt: Date,
  nowMs: number = Date.now()
): number => {
  const autostandAt = updatedAt.getTime() + blackjackAutostandIdleMs()
  const hoursLeft = (autostandAt - nowMs) / MS_PER_HOUR
  return Math.max(1, Math.ceil(hoursLeft))
}
