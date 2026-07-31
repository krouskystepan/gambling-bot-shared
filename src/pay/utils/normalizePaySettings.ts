import {
  type TPaySettings,
  defaultPaySettings
} from '../constants/defaultPaySettings'

const coerceNumber = (value: unknown, fallback: number): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

const clamp01 = (value: number): number => Math.min(Math.max(value, 0), 1)

export const normalizePaySettings = (
  settings: Partial<TPaySettings> | null | undefined
): TPaySettings => ({
  feePercent: clamp01(
    coerceNumber(settings?.feePercent, defaultPaySettings.feePercent)
  ),
  minAmount: Math.max(
    0,
    coerceNumber(settings?.minAmount, defaultPaySettings.minAmount)
  ),
  maxAmount: Math.max(
    0,
    coerceNumber(settings?.maxAmount, defaultPaySettings.maxAmount)
  ),
  maxDailyAmount: Math.max(
    0,
    coerceNumber(settings?.maxDailyAmount, defaultPaySettings.maxDailyAmount)
  )
})
