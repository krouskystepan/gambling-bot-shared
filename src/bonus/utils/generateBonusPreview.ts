import type { BonusSettings } from '../types/bonus'
import { calculateBonusReward } from './calculateBonusReward'

export const PREVIEW_DAYS = 60

export type PreviewDay = {
  day: number
  reward: number
  base: number
  weekly: number
  monthly: number
  isReset: boolean
}

export const generateBonusPreview = (
  settings: BonusSettings,
  days: number = PREVIEW_DAYS
): PreviewDay[] => {
  const result: PreviewDay[] = []

  for (let day = 1; day <= days; day++) {
    const r = calculateBonusReward({
      streak: day,
      settings
    })

    result.push({
      day,
      reward: r.reward,
      base: r.base,
      weekly: r.weekly,
      monthly: r.monthly,
      isReset: r.isReset
    })
  }

  return result
}
