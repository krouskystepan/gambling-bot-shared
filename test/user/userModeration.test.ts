import {
  appendStaffNote,
  closeLatestBanHistoryEntry,
  isUserBanned,
  normalizeStaffNote,
  startBanHistoryEntry
} from 'gambling-bot-shared/user'
import { describe, expect, it } from 'vitest'

describe('isUserBanned', () => {
  it('returns true when banned flag is set', () => {
    expect(isUserBanned({ banned: true })).toBe(true)
  })

  it('returns false when banned flag is unset', () => {
    expect(isUserBanned({ banned: false })).toBe(false)
  })
})

describe('normalizeStaffNote', () => {
  it('trims and accepts valid notes', () => {
    expect(normalizeStaffNote('  hello  ')).toBe('hello')
  })

  it('rejects empty notes', () => {
    expect(normalizeStaffNote('   ')).toBeNull()
  })

  it('caps note length at 500 characters', () => {
    const long = 'a'.repeat(600)
    expect(normalizeStaffNote(long)?.length).toBe(500)
  })
})

describe('appendStaffNote', () => {
  it('prepends newest notes and caps list size', () => {
    const existing = Array.from({ length: 50 }, (_, index) => ({
      text: `note-${index}`,
      authorId: 'mod-1',
      createdAt: new Date()
    }))

    const next = appendStaffNote(existing, {
      text: 'newest',
      authorId: 'mod-2',
      createdAt: new Date()
    })

    expect(next).toHaveLength(50)
    expect(next[0]?.text).toBe('newest')
    expect(next[49]?.text).toBe('note-48')
  })
})

describe('ban history helpers', () => {
  it('starts a new open ban history entry', () => {
    const history = startBanHistoryEntry({
      history: [],
      bannedBy: 'mod-1',
      reason: 'abuse'
    })

    expect(history).toHaveLength(1)
    expect(history[0]?.bannedBy).toBe('mod-1')
    expect(history[0]?.reason).toBe('abuse')
    expect(history[0]?.unbannedAt).toBeNull()
  })

  it('closes the latest open ban history entry', () => {
    const history = startBanHistoryEntry({
      history: [],
      bannedBy: 'mod-1'
    })

    const closed = closeLatestBanHistoryEntry({
      history,
      unbannedBy: 'mod-2'
    })

    expect(closed[0]?.unbannedBy).toBe('mod-2')
    expect(closed[0]?.unbannedAt).toBeInstanceOf(Date)
  })
})
