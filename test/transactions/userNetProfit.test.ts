import {
  computeUserNetProfit,
  computeUserNetProfitDelta
} from 'gambling-bot-shared/transactions'
import { describe, expect, it } from 'vitest'

describe('computeUserNetProfit', () => {
  it('maps bet/win/bonus deltas', () => {
    expect(computeUserNetProfitDelta('bet', 10)).toBe(-10)
    expect(computeUserNetProfitDelta('win', 25)).toBe(25)
    expect(computeUserNetProfitDelta('bonus', 5)).toBe(5)
    expect(computeUserNetProfitDelta('deposit', 100)).toBe(0)
    expect(computeUserNetProfitDelta('refund', 5)).toBe(0)
    expect(computeUserNetProfitDelta('vip', 5)).toBe(0)
    expect(computeUserNetProfitDelta('withdraw', 5)).toBe(0)
  })

  it('rolls up a transaction list', () => {
    expect(
      computeUserNetProfit([
        { type: 'bet', amount: 100 },
        { type: 'win', amount: 40 },
        { type: 'bonus', amount: 10 },
        { type: 'refund', amount: 5 }
      ])
    ).toBe(-50)
  })
})
