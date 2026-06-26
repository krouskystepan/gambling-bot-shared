import type { TUser, TUserBanHistoryEntry, TUserStaffNote } from '../types/user'

export const USER_BANNED_ERROR = 'USER_BANNED'

export const USER_BANNED_MESSAGE =
  'Your account is restricted. Contact server staff.'

export function isUserBanned(user: Pick<TUser, 'banned'>): boolean {
  return Boolean(user.banned)
}

export function normalizeStaffNote(text: string): string | null {
  const trimmed = text.trim()
  if (!trimmed) return null
  return trimmed.slice(0, 500)
}

export function appendStaffNote(
  notes: TUserStaffNote[],
  entry: TUserStaffNote,
  maxNotes = 50
): TUserStaffNote[] {
  return [entry, ...notes].slice(0, maxNotes)
}

export function startBanHistoryEntry({
  history,
  bannedBy,
  reason,
  maxEntries = 50
}: {
  history: TUserBanHistoryEntry[]
  bannedBy: string
  reason?: string
  maxEntries?: number
}): TUserBanHistoryEntry[] {
  const entry: TUserBanHistoryEntry = {
    bannedAt: new Date(),
    bannedBy,
    unbannedAt: null,
    unbannedBy: null,
    ...(reason ? { reason } : {})
  }

  return [entry, ...history].slice(0, maxEntries)
}

export function closeLatestBanHistoryEntry({
  history,
  unbannedBy
}: {
  history: TUserBanHistoryEntry[]
  unbannedBy: string
}): TUserBanHistoryEntry[] {
  const openIndex = history.findIndex((entry) => entry.unbannedAt === null)
  if (openIndex === -1) return history

  const updated = [...history]
  updated[openIndex] = {
    ...updated[openIndex],
    unbannedAt: new Date(),
    unbannedBy
  }

  return updated
}
