import {
  HILO_GUESS_TIMEOUT_MS,
  HILO_IDLE_NUDGE_MS,
  hiloGuessTimeoutMs,
  hiloIdleNudgeThresholdMs,
  minutesUntilHiloTimeout
} from 'gambling-bot-shared/casino'
import { HOUR_MS, MINUTE_MS } from 'gambling-bot-shared/common'
import { describe, expect, it } from 'vitest'

describe('hiloWorkers', () => {
  it('uses a 1h guess timeout and 30m idle nudge', () => {
    expect(hiloGuessTimeoutMs()).toBe(HILO_GUESS_TIMEOUT_MS)
    expect(HILO_GUESS_TIMEOUT_MS).toBe(1 * HOUR_MS)
    expect(hiloIdleNudgeThresholdMs()).toBe(HILO_IDLE_NUDGE_MS)
    expect(HILO_IDLE_NUDGE_MS).toBe(30 * MINUTE_MS)
  })

  it('reports minutes left until timeout for nudge copy', () => {
    const createdAt = new Date(Date.now() - 30 * MINUTE_MS)
    expect(minutesUntilHiloTimeout(createdAt)).toBe(30)
  })
})
