import { generateId, sessionBetId } from 'gambling-bot-shared/common'
import { describe, expect, it } from 'vitest'

describe('generateId', () => {
  it('returns uppercase alphanumeric id without prefix', () => {
    const id = generateId()
    expect(id).toMatch(/^[0-9A-Z]{8}$/)
  })

  it('returns prefixed id with hyphen separator', () => {
    const id = generateId('slots')
    expect(id).toMatch(/^slots-[0-9A-Z]{8}$/)
  })

  it('keeps distinct bodies across calls', () => {
    const a = generateId('quest')
    const b = generateId('quest')
    expect(a).not.toBe(b)
  })
})

describe('sessionBetId', () => {
  it('scopes a bet under the session id', () => {
    expect(sessionBetId('slots-ABC12345', 1)).toBe('slots-ABC12345:1')
    expect(sessionBetId('blackjack-XYZ', 'd0')).toBe('blackjack-XYZ:d0')
  })
})
