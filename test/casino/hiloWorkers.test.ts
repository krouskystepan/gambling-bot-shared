import {
  HILO_GUESS_TIMEOUT_MS,
  HILO_IDLE_CLOSE_DAYS,
  HILO_IDLE_NUDGE_MS,
  hiloGuessTimeoutMs,
  hiloIdleCloseMs,
  hiloIdleNudgeThresholdMs,
  minutesUntilHiloTimeout
} from 'gambling-bot-shared/casino'
import { DAY_MS, HOUR_MS, MINUTE_MS } from 'gambling-bot-shared/common'
import { describe, expect, it } from 'vitest'

describe('hiloWorkers', () => {
  it('uses a 1h guess timeout and 30m idle nudge', () => {
    expect(hiloGuessTimeoutMs()).toBe(HILO_GUESS_TIMEOUT_MS)
    expect(HILO_GUESS_TIMEOUT_MS).toBe(1 * HOUR_MS)
    expect(hiloIdleNudgeThresholdMs()).toBe(HILO_IDLE_NUDGE_MS)
    expect(HILO_IDLE_NUDGE_MS).toBe(30 * MINUTE_MS)
    expect(hiloIdleCloseMs()).toBe(HILO_IDLE_CLOSE_DAYS * DAY_MS)
    expect(HILO_IDLE_CLOSE_DAYS).toBe(1)
  })

  it('reports minutes left until timeout for nudge copy', () => {
    const waitingSince = new Date(Date.now() - 30 * MINUTE_MS)
    expect(minutesUntilHiloTimeout(waitingSince)).toBe(30)
  })
})
