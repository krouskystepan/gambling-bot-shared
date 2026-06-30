import type { TUserBan } from '../types/userBan'
import { normalizeStaffNote } from './userModeration'

export function normalizeBanReason(reason?: string | null): string | undefined {
  const normalized = reason ? normalizeStaffNote(reason) : null
  return normalized ?? undefined
}

export function isUserBanActive(ban: Pick<TUserBan, 'unbannedAt'>): boolean {
  return ban.unbannedAt === null
}
