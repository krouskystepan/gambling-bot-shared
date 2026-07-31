import type { CasinoGameId } from '../../casino/constants/casinoGames'

export type TransactionMeta = {
  game?: CasinoGameId
  counterpartyId?: string
  grossAmount?: number
  feeAmount?: number
  feePercent?: number
  netAmount?: number
} & Record<string, unknown>

export type TTransaction = {
  userId: string
  guildId: string
  amount: number
  type:
    | 'deposit'
    | 'withdraw'
    | 'bet'
    | 'win'
    | 'refund'
    | 'bonus'
    | 'vip'
    | 'transfer_out'
    | 'transfer_in'
  source: 'command' | 'manual' | 'web' | 'system' | 'casino'
  meta?: TransactionMeta
  referenceId?: string
  handledBy?: string
  createdAt: Date
}
