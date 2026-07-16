import type { TTransaction } from './types/transaction'

/** Delta toward user net profit for a single transaction type. */
export function computeUserNetProfitDelta(
  type: TTransaction['type'],
  amount: number
): number {
  switch (type) {
    case 'bet':
      return -amount
    case 'win':
    case 'bonus':
      return amount
    default:
      return 0
  }
}

export function computeUserNetProfit(
  transactions: Array<{ type: TTransaction['type']; amount: number }>
): number {
  return transactions.reduce(
    (sum, tx) => sum + computeUserNetProfitDelta(tx.type, tx.amount),
    0
  )
}
