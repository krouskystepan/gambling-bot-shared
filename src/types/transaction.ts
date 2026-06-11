import type { CasinoGameId } from '../constants/casinoGames'

export type TransactionMeta = {
  game?: CasinoGameId
} & Record<string, unknown>

export type TTransaction = {
  userId: string
  guildId: string
  amount: number
  type: 'deposit' | 'withdraw' | 'bet' | 'win' | 'refund' | 'bonus' | 'vip'
  source: 'command' | 'manual' | 'web' | 'system' | 'casino'
  meta?: TransactionMeta
  betId?: string
  handledBy?: string
  createdAt: Date
}
