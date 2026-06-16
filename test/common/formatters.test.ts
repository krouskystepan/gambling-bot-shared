import { readableGameNames } from 'gambling-bot-shared/casino'
import {
  formatCasinoGameLabel,
  formatMoney,
  formatMoneyExact,
  formatNumberToPercentage,
  formatNumberToReadableString,
  formatNumberWithSpaces,
  formatTransactionSourceLabel,
  formatTransactionTypeLabel,
  getReadableName,
  parseReadableStringToNumber
} from 'gambling-bot-shared/common'
import { describe, expect, it } from 'vitest'

describe('parseReadableStringToNumber', () => {
  it('parses k, M, B suffixes and plain numbers', () => {
    expect(parseReadableStringToNumber('2k')).toBe(2000)
    expect(parseReadableStringToNumber('4.5M')).toBe(4_500_000)
    expect(parseReadableStringToNumber('1B')).toBe(1_000_000_000)
    expect(parseReadableStringToNumber('250')).toBe(250)
    expect(parseReadableStringToNumber('not-a-bet')).toBeNaN()
  })
})

describe('formatNumberToReadableString', () => {
  it('formats scaled values', () => {
    expect(formatNumberToReadableString(2500)).toBe('2.5k')
    expect(formatNumberToReadableString(4_500_000)).toBe('4.5M')
    expect(formatNumberToReadableString(2_500_000_000)).toBe('2.5B')
    expect(formatNumberToReadableString(42)).toBe('42')
    expect(formatNumberToReadableString(-1000)).toBe('-1k')
  })
})

describe('formatNumberWithSpaces', () => {
  it('groups thousands with spaces', () => {
    expect(formatNumberWithSpaces(1234567)).toBe('1 234 567')
  })
})

describe('formatNumberToPercentage', () => {
  it('formats ratio as percent string', () => {
    expect(formatNumberToPercentage(0.125)).toBe('12.50%')
  })
})

describe('formatMoney', () => {
  const usdPrefix = {
    currencySymbol: '$',
    currencyPlacement: 'prefix' as const
  }

  it('formats prefix and suffix currency', () => {
    expect(formatMoney(1500, usdPrefix)).toBe('$1.5k')
    expect(formatMoneyExact(1500, usdPrefix)).toBe('$1 500')
    expect(
      formatMoney(1500, { currencySymbol: 'CZK', currencyPlacement: 'suffix' })
    ).toBe('1.5kCZK')
    expect(formatMoney(-1500, usdPrefix)).toBe('-$1.5k')
  })
})

describe('labels', () => {
  it('formats transaction and game labels', () => {
    expect(formatTransactionSourceLabel('casino')).toBe('CASINO')
    expect(formatTransactionTypeLabel('bet')).toBe('BET')
    expect(getReadableName('dice', readableGameNames)).toBe('Dice')
    expect(getReadableName('unknown-game', readableGameNames)).toBe(
      'unknown-game'
    )
    expect(formatCasinoGameLabel('dice')).toBe('DICE')
  })
})
