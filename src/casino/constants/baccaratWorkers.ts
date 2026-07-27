import { DAY_MS, HOUR_MS } from '../../common/durations'

/** Same idle window as blackjack: nudge at 3h, auto-refund at 1 day. */
export const BACCARAT_IDLE_REFUND_DAYS = 1
export const BACCARAT_IDLE_NUDGE_HOURS = 3

export const baccaratIdleNudgeThresholdMs = (): number =>
  BACCARAT_IDLE_NUDGE_HOURS * HOUR_MS

export const baccaratIdleRefundMs = (): number =>
  BACCARAT_IDLE_REFUND_DAYS * DAY_MS

export const hoursUntilBaccaratIdleRefund = (
  updatedAt: Date,
  nowMs: number = Date.now()
): number => {
  const refundAt = updatedAt.getTime() + baccaratIdleRefundMs()
  const hoursLeft = (refundAt - nowMs) / HOUR_MS
  return Math.max(1, Math.ceil(hoursLeft))
}
