import { parseTimeToSeconds } from 'gambling-bot-shared/common'
import { describe, expect, it } from 'vitest'

describe('parseTimeToSeconds', () => {
  it('parses combined units', () => {
    expect(parseTimeToSeconds('1d2h')).toBe(86400 + 7200)
    expect(parseTimeToSeconds('30m')).toBe(1800)
    expect(parseTimeToSeconds('1w')).toBe(604_800)
    expect(parseTimeToSeconds('')).toBe(0)
  })
})
