/**
 * Pure withdrawable-balance check shared by Discord ATM flow and admin panel.
 */
export type PreviewWithdrawBalanceResult =
  | { ok: true; withdrawable: number }
  | {
      ok: false
      reason: 'INSUFFICIENT_BALANCE' | 'INSUFFICIENT_WITHDRAWABLE'
      balance: number
      withdrawable: number
      locked: number
    }

export function getWithdrawableBalance(
  balance: number,
  lockedBalance: number
): number {
  return balance - lockedBalance
}

export function previewWithdrawBalance(
  balance: number,
  lockedBalance: number,
  amount: number
): PreviewWithdrawBalanceResult {
  const withdrawable = getWithdrawableBalance(balance, lockedBalance)

  if (balance < amount) {
    return {
      ok: false,
      reason: 'INSUFFICIENT_BALANCE',
      balance,
      withdrawable,
      locked: lockedBalance
    }
  }

  if (withdrawable < amount) {
    return {
      ok: false,
      reason: 'INSUFFICIENT_WITHDRAWABLE',
      balance,
      withdrawable,
      locked: lockedBalance
    }
  }

  return { ok: true, withdrawable }
}
