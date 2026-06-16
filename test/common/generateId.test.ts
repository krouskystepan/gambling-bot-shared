import { generateId } from 'gambling-bot-shared/common'
import { describe, expect, it } from 'vitest'

describe('generateId', () => {
  it('returns uppercase alphanumeric id', () => {
    const id = generateId()
    expect(id).toMatch(/^[0-9A-Z]+$/)
    expect(id.length).toBeGreaterThan(5)
  })
})
