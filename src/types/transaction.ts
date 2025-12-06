export type TTransaction = {
  userId: string
  guildId: string
  amount: number
  type: 'deposit' | 'withdraw' | 'bet' | 'win' | 'refund' | 'bonus' | 'vip'
  source: 'command' | 'manual' | 'web' | 'system' | 'casino'
  meta?: Record<string, any>
  betId?: string
  handledBy?: string
  createdAt: Date
}
