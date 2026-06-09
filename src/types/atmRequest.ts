export type TAtmRequest = {
  requestId: string
  guildId: string
  userId: string

  type: 'deposit' | 'withdraw'
  amount: number
  account: string

  status: 'pending' | 'approved' | 'rejected'
  handledBy?: string
  handledAt?: Date

  logChannelId: string
  logMessageId: string

  createdAt: Date
  updatedAt: Date
}
