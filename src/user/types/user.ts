export type TUserStaffNote = {
  text: string
  authorId: string
  createdAt: Date
}

export type TUserBanHistoryEntry = {
  bannedAt: Date
  bannedBy: string
  unbannedAt: Date | null
  unbannedBy: string | null
  reason?: string
}

export type TUser = {
  userId: string
  guildId: string
  balance: number
  bonusBalance: number
  lockedBalance: number
  lastDailyClaim: Date | null
  dailyStreak: number
  banned: boolean
  bannedAt: Date | null
  bannedBy: string | null
  banHistory: TUserBanHistoryEntry[]
  staffNotes: TUserStaffNote[]
  createdAt: Date
  updatedAt: Date
}
