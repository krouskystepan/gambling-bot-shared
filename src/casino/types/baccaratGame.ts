export type TBaccaratGame = {
  userId: string
  guildId: string
  channelId: string
  messageId: string
  betId: string
  betAmount: number
  showBalance: boolean
  skipAnimations: boolean

  idleNudgeSentAt?: Date | null

  createdAt: Date
  updatedAt: Date
}
