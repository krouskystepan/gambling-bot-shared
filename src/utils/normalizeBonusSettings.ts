import {
  BONUS_MAX_AMOUNT,
  BONUS_MAX_STREAK_MULTIPLIER
} from '../constants/bonusLimits'
import type { BonusSettings } from '../types'

const clampAmount = (value: number): number =>
  Math.min(Math.max(0, value), BONUS_MAX_AMOUNT)

const clampMultiplier = (value: number): number =>
  Math.min(Math.max(0, value), BONUS_MAX_STREAK_MULTIPLIER)

export const normalizeBonusSettings = (
  settings: BonusSettings
): BonusSettings => ({
  ...settings,
  baseReward: clampAmount(settings.baseReward),
  streakIncrement:
    settings.streakIncrement != null
      ? clampAmount(settings.streakIncrement)
      : undefined,
  streakMultiplier:
    settings.streakMultiplier != null
      ? clampMultiplier(settings.streakMultiplier)
      : undefined,
  maxReward: clampAmount(settings.maxReward),
  milestoneBonus: {
    weekly: clampAmount(settings.milestoneBonus.weekly),
    monthly: clampAmount(settings.milestoneBonus.monthly)
  }
})

/** Parse admin integer inputs (digits only) and clamp to the bonus amount cap. */
export const parseBonusAmountInput = (raw: string): number => {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return 0
  return clampAmount(Number(digits))
}

/** Parse streak multiplier text and clamp to the allowed range. */
export const parseBonusMultiplierInput = (raw: string): number | undefined => {
  const parsed = Number(raw)
  if (Number.isNaN(parsed)) return undefined
  return clampMultiplier(parsed)
}
