export type TUserStaffNote = {
  noteId: string
  text: string
  authorId: string
  createdAt: Date
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
  staffNotes: TUserStaffNote[]
  createdAt: Date
  updatedAt: Date
}
