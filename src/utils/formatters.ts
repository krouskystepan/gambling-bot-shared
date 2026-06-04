import type { GlobalSettings } from '../constants/defaultGlobalSettings'

import { getCurrencyPlacement, getCurrencySymbol } from './globalSettings'

const formatAmountWithCurrency = (
  amount: number,
  formattedAbsAmount: string,
  globalSettings?: Partial<GlobalSettings> | null
): string => {
  const negative = amount < 0
  const sign = negative ? '-' : ''

  const symbol = getCurrencySymbol(globalSettings)

  if (getCurrencyPlacement(globalSettings) === 'suffix') {
    return `${sign}${formattedAbsAmount}${symbol}`
  }

  return `${sign}${symbol}${formattedAbsAmount}`
}

export const formatNumberToReadableString = (number: number): string => {
  const absNumber = Math.abs(number)

  const roundTo = (num: number, digits = 2) =>
    Math.round(num * 10 ** digits) / 10 ** digits

  let formatted: string

  if (absNumber >= 1_000_000_000) {
    formatted = `${roundTo(absNumber / 1_000_000_000)}B`
  } else if (absNumber >= 1_000_000) {
    formatted = `${roundTo(absNumber / 1_000_000)}M`
  } else if (absNumber >= 1_000) {
    formatted = `${roundTo(absNumber / 1_000)}k`
  } else {
    formatted = roundTo(absNumber).toString()
  }

  return number < 0 ? `-${formatted}` : formatted
}

export const parseReadableStringToNumber = (readableString: string): number => {
  const normalizedString = readableString.toUpperCase()

  if (!/^[-]?[0-9.]+[BMK]?$/.test(normalizedString)) {
    return NaN
  }

  if (normalizedString.endsWith('B')) {
    return parseFloat(normalizedString.slice(0, -1)) * 1_000_000_000
  } else if (normalizedString.endsWith('M')) {
    return parseFloat(normalizedString.slice(0, -1)) * 1_000_000
  } else if (normalizedString.endsWith('K')) {
    return parseFloat(normalizedString.slice(0, -1)) * 1_000
  } else {
    return parseFloat(normalizedString)
  }
}

export const formatNumberWithSpaces = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

/** Compact amount with guild currency (prefix or suffix symbol). */
export const formatMoney = (
  amount: number,
  globalSettings?: Partial<GlobalSettings> | null
): string =>
  formatAmountWithCurrency(
    amount,
    formatNumberToReadableString(Math.abs(amount)),
    globalSettings
  )

/** Full-precision amount with guild currency (prefix or suffix symbol). */
export const formatMoneyExact = (
  amount: number,
  globalSettings?: Partial<GlobalSettings> | null
): string =>
  formatAmountWithCurrency(
    amount,
    formatNumberWithSpaces(Math.abs(amount)),
    globalSettings
  )

export const formatNumberToPercentage = (num: number): string => {
  return (num * 100).toFixed(2) + '%'
}

export const getReadableName = (
  key: string,
  map: { name: string; value: string }[]
): string => {
  const found = map.find((item) => item.value === key)
  return found ? found.name : key
}
