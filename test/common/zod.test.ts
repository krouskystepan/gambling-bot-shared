import { num } from 'gambling-bot-shared/common'
import { describe, expect, it } from 'vitest'

describe('num', () => {
  it('coerces strings and empty values to numbers', () => {
    expect(num.parse(42)).toBe(42)
    expect(num.parse('12.5')).toBe(12.5)
    expect(num.parse('')).toBe(0)
    expect(num.parse('not-a-number')).toBe(0)
  })
})
