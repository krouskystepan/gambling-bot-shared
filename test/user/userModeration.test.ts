import {
  MODERATION_MANAGER_TARGET_ERROR,
  MODERATION_SELF_ERROR,
  appendStaffNote,
  canModerateUserTarget,
  createStaffNoteEntry,
  isUserBanned,
  normalizeStaffNote,
  normalizeStaffNotes,
  removeStaffNote,
  updateStaffNote
} from 'gambling-bot-shared/user'
import { describe, expect, it } from 'vitest'

describe('canModerateUserTarget', () => {
  it('denies self moderation', () => {
    expect(
      canModerateUserTarget({
        actorUserId: 'mod-1',
        actorIsElevated: false,
        targetUserId: 'mod-1',
        targetHasManagerRole: false
      })
    ).toEqual({ ok: false, code: 'SELF' })
  })

  it('denies manager moderating another manager', () => {
    expect(
      canModerateUserTarget({
        actorUserId: 'mod-1',
        actorIsElevated: false,
        targetUserId: 'mod-2',
        targetHasManagerRole: true
      })
    ).toEqual({ ok: false, code: 'MANAGER_TARGET' })
  })

  it('allows manager moderating a player', () => {
    expect(
      canModerateUserTarget({
        actorUserId: 'mod-1',
        actorIsElevated: false,
        targetUserId: 'player-1',
        targetHasManagerRole: false
      })
    ).toEqual({ ok: true })
  })

  it('allows elevated staff moderating a manager', () => {
    expect(
      canModerateUserTarget({
        actorUserId: 'admin-1',
        actorIsElevated: true,
        targetUserId: 'mod-2',
        targetHasManagerRole: true
      })
    ).toEqual({ ok: true })
  })

  it('exports moderation error messages', () => {
    expect(MODERATION_SELF_ERROR).toContain('yourself')
    expect(MODERATION_MANAGER_TARGET_ERROR).toContain('Managers')
  })
})

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
      noteId: `note-${index}`,
      text: `note-${index}`,
      authorId: 'mod-1',
      createdAt: new Date()
    }))

    const next = appendStaffNote(existing, {
      noteId: 'note-new',
      text: 'newest',
      authorId: 'mod-2',
      createdAt: new Date()
    })

    expect(next).toHaveLength(50)
    expect(next[0]?.text).toBe('newest')
    expect(next[49]?.text).toBe('note-48')
  })
})

describe('staff note CRUD helpers', () => {
  it('creates note entries with ids', () => {
    const note = createStaffNoteEntry('  hello  ', 'mod-1')

    expect(note?.text).toBe('hello')
    expect(note?.authorId).toBe('mod-1')
    expect(note?.noteId).toBeTruthy()
  })

  it('rejects empty create requests', () => {
    expect(createStaffNoteEntry('   ', 'mod-1')).toBeNull()
  })

  it('normalizes stored notes and assigns ids when missing', () => {
    const notes = normalizeStaffNotes([
      {
        text: ' hello ',
        authorId: 'mod-1',
        createdAt: new Date('2026-06-29T12:00:00.000Z')
      },
      {
        noteId: 'note-1',
        text: 'kept',
        authorId: 'mod-2',
        createdAt: new Date('2026-06-29T13:00:00.000Z')
      },
      {
        text: '   ',
        authorId: 'mod-3'
      },
      {
        text: 'no author',
        authorId: ''
      }
    ])

    expect(notes).toHaveLength(2)
    expect(notes[0]?.text).toBe('hello')
    expect(notes[0]?.noteId).toBeTruthy()
    expect(notes[1]?.noteId).toBe('note-1')
  })

  it('defaults createdAt when missing', () => {
    const notes = normalizeStaffNotes([
      {
        noteId: 'note-2',
        text: 'fresh',
        authorId: 'mod-1'
      }
    ])

    expect(notes[0]?.createdAt).toBeInstanceOf(Date)
  })

  it('updates and removes notes by id', () => {
    const notes = [
      {
        noteId: 'note-1',
        text: 'first',
        authorId: 'mod-1',
        createdAt: new Date()
      },
      {
        noteId: 'note-2',
        text: 'second',
        authorId: 'mod-2',
        createdAt: new Date()
      }
    ]

    expect(updateStaffNote(notes, 'note-2', 'updated')?.[1]?.text).toBe(
      'updated'
    )
    expect(removeStaffNote(notes, 'note-1')).toHaveLength(1)
  })

  it('returns null when update or delete targets are invalid', () => {
    const notes = [
      {
        noteId: 'note-1',
        text: 'first',
        authorId: 'mod-1',
        createdAt: new Date()
      }
    ]

    expect(updateStaffNote(notes, 'missing', 'updated')).toBeNull()
    expect(updateStaffNote(notes, 'note-1', '   ')).toBeNull()
    expect(removeStaffNote(notes, 'missing')).toBeNull()
  })
})
