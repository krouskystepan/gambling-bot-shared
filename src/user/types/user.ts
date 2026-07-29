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
  /** Consecutive guild calendar days with ≥1 daily quest completed. */
  questDailyStreak: number
  /** yyyy-MM-dd (guild TZ) of last day a daily quest was completed. */
  lastQuestDailyCompleteDate: string | null
  banned: boolean
  bannedAt: Date | null
  bannedBy: string | null
  staffNotes: TUserStaffNote[]
  createdAt: Date
  updatedAt: Date
}
