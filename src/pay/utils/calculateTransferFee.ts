/** Cents-safe fee math: sender pays gross, receiver gets net, fee is burned. */
export function calculateTransferFee(
  grossAmount: number,
  feePercent: number
): {
  grossAmount: number
  feePercent: number
  feeAmount: number
  netAmount: number
} {
  const pct = Math.min(Math.max(feePercent, 0), 1)
  const feeAmount = Math.round(grossAmount * pct * 100) / 100
  const netAmount = Math.round((grossAmount - feeAmount) * 100) / 100

  return {
    grossAmount,
    feePercent: pct,
    feeAmount,
    netAmount
  }
}
