import {
  getWithdrawableBalance,
  previewWithdrawBalance
} from 'gambling-bot-shared/atm'
import { describe, expect, it } from 'vitest'

describe('getWithdrawableBalance', () => {
  it('subtracts locked funds from balance', () => {
    expect(getWithdrawableBalance(100, 25)).toBe(75)
  })
})

describe('previewWithdrawBalance', () => {
  it('allows withdrawable amounts', () => {
    expect(previewWithdrawBalance(100, 20, 50)).toEqual({
      ok: true,
      withdrawable: 80
    })
  })

  it('rejects when balance is below amount', () => {
    expect(previewWithdrawBalance(40, 0, 50)).toEqual({
      ok: false,
      reason: 'INSUFFICIENT_BALANCE',
      balance: 40,
      withdrawable: 40,
      locked: 0
    })
  })

  it('rejects when locked funds reduce withdrawable amount', () => {
    expect(previewWithdrawBalance(100, 60, 50)).toEqual({
      ok: false,
      reason: 'INSUFFICIENT_WITHDRAWABLE',
      balance: 100,
      withdrawable: 40,
      locked: 60
    })
  })
})
