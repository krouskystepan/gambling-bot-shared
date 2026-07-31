export const defaultPaySettings = {
  /** Fraction 0–1. Sender pays: debit gross, credit net, fee burned. */
  feePercent: 0.02,
  /** 0 = uncapped (same as casino minBet). Hard floor remains $1. */
  minAmount: 0,
  /** 0 = uncapped (same as casino maxBet). */
  maxAmount: 0,
  /** Max sum of today's transfer_out gross in guild timezone. 0 = uncapped. */
  maxDailyAmount: 0
}

export type TPaySettings = typeof defaultPaySettings
