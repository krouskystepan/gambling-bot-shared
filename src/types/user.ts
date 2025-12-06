export type TUser = {
  userId: string
  guildId: string
  balance: number
  lockedBalance: number
  lastDailyClaim: Date | null
  dailyStreak: number
  createdAt: Date
  updatedAt: Date
}
