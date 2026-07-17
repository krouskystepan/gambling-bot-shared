import { parseReadableStringToNumber } from '../../common/formatters'
import {
  BONUS_MAX_AMOUNT,
  BONUS_MAX_STREAK_MULTIPLIER
} from '../constants/bonusLimits'
import type { BonusSettings } from '../types/bonus'

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

/** Parse admin money inputs (`1000`, `2k`, `4.5k`) and clamp to the bonus amount cap. */
export const parseBonusAmountInput = (raw: string): number => {
  const trimmed = raw.trim()
  if (!trimmed) return 0
  const parsed = parseReadableStringToNumber(trimmed)
  if (Number.isNaN(parsed)) return 0
  return clampAmount(parsed)
}

/** Parse streak multiplier text and clamp to the allowed range. */
export const parseBonusMultiplierInput = (raw: string): number | undefined => {
  const parsed = Number(raw)
  if (Number.isNaN(parsed)) return undefined
  return clampMultiplier(parsed)
}
