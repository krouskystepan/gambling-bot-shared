import type { TTransaction } from '../types/transaction'

export const TRANSACTION_TYPES = [
  'deposit',
  'withdraw',
  'bet',
  'win',
  'refund',
  'bonus',
  'vip'
] as const satisfies readonly TTransaction['type'][]

export const TRANSACTION_SOURCES = [
  'command',
  'manual',
  'web',
  'system',
  'casino'
] as const satisfies readonly TTransaction['source'][]
