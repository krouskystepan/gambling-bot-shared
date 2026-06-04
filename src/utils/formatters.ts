import type { GlobalSettings } from '../constants/defaultGlobalSettings'

import { getCurrencySymbol } from './globalSettings'

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

/** Compact amount with guild currency symbol (v1: symbol only, not Intl). */
export const formatMoney = (
  amount: number,
  globalSettings?: Partial<GlobalSettings> | null
): string => `${getCurrencySymbol(globalSettings)}${formatNumberToReadableString(amount)}`

/** Full-precision amount with guild currency symbol. */
export const formatMoneyExact = (
  amount: number,
  globalSettings?: Partial<GlobalSettings> | null
): string =>
  `${getCurrencySymbol(globalSettings)}${formatNumberWithSpaces(amount)}`

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
