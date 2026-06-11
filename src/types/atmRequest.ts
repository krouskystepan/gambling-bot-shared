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
  notes?: string

  logChannelId?: string
  logMessageId?: string

  meta?: Record<string, unknown>

  createdAt: Date
  updatedAt: Date
}
