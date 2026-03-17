export type TUser = {
  userId: string
  guildId: string
  balance: number
  bonusBalance: number
  lockedBalance: number
  lastDailyClaim: Date | null
  dailyStreak: number
  createdAt: Date
  updatedAt: Date
}
