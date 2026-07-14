import { generateId } from '../../common/generateId'
import type { TUser, TUserStaffNote } from '../types/user'

export const USER_BANNED_ERROR = 'USER_BANNED'

export const USER_BANNED_MESSAGE =
  'Your account is restricted. Contact server staff.'

export const MODERATION_SELF_ERROR = 'You cannot ban or unban yourself.'

export const MODERATION_MANAGER_TARGET_ERROR =
  'Managers cannot ban or unban other managers.'

export function canModerateUserTarget({
  actorUserId,
  actorIsElevated,
  targetUserId,
  targetHasManagerRole
}: {
  actorUserId: string
  actorIsElevated: boolean
  targetUserId: string
  targetHasManagerRole: boolean
}): { ok: true } | { ok: false; code: 'SELF' | 'MANAGER_TARGET' } {
  if (actorUserId === targetUserId) {
    return { ok: false, code: 'SELF' }
  }

  if (targetHasManagerRole && !actorIsElevated) {
    return { ok: false, code: 'MANAGER_TARGET' }
  }

  return { ok: true }
}

export function isUserBanned(user: Pick<TUser, 'banned'>): boolean {
  return Boolean(user.banned)
}

export function normalizeStaffNote(text: string): string | null {
  const trimmed = text.trim()
  if (!trimmed) return null
  return trimmed.slice(0, 500)
}

export function createStaffNoteEntry(
  text: string,
  authorId: string
): TUserStaffNote | null {
  const normalized = normalizeStaffNote(text)
  if (!normalized) return null

  return {
    noteId: generateId(),
    text: normalized,
    authorId,
    createdAt: new Date()
  }
}

type StaffNoteLike = {
  noteId?: string
  text: string
  authorId: string
  createdAt?: Date | string
}

export function normalizeStaffNotes(notes: StaffNoteLike[]): TUserStaffNote[] {
  return notes.flatMap((note) => {
    const text = normalizeStaffNote(note.text)
    if (!text || !note.authorId) return []

    return [
      {
        noteId:
          typeof note.noteId === 'string' && note.noteId.length > 0
            ? note.noteId
            : generateId(),
        text,
        authorId: note.authorId,
        createdAt: note.createdAt ? new Date(note.createdAt) : new Date()
      }
    ]
  })
}

export function appendStaffNote(
  notes: TUserStaffNote[],
  entry: TUserStaffNote,
  maxNotes = 50
): TUserStaffNote[] {
  return [entry, ...notes].slice(0, maxNotes)
}

export function updateStaffNote(
  notes: TUserStaffNote[],
  noteId: string,
  text: string
): TUserStaffNote[] | null {
  const normalized = normalizeStaffNote(text)
  if (!normalized) return null

  const index = notes.findIndex((note) => note.noteId === noteId)
  if (index === -1) return null

  const updated = [...notes]
  updated[index] = { ...updated[index], text: normalized }
  return updated
}

export function removeStaffNote(
  notes: TUserStaffNote[],
  noteId: string
): TUserStaffNote[] | null {
  const next = notes.filter((note) => note.noteId !== noteId)
  return next.length === notes.length ? null : next
}
