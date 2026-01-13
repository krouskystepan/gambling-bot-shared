import type { BonusSettings } from '../types'

export type CalculateBonusRewardInput = {
  streak: number
  settings: BonusSettings
}

export type CalculateBonusRewardResult = {
  reward: number
  base: number
  weekly: number
  monthly: number
  isReset: boolean
}

export const calculateBonusReward = ({
  streak,
  settings
}: CalculateBonusRewardInput): CalculateBonusRewardResult => {
  const {
    rewardMode,
    baseReward,
    streakIncrement = 0,
    streakMultiplier = 1,
    maxReward,
    resetOnMax,
    milestoneBonus
  } = settings

  let base =
    rewardMode === 'linear'
      ? baseReward + (streak - 1) * streakIncrement
      : baseReward * Math.pow(streakMultiplier, streak - 1)

  let isReset = false

  if (maxReward > 0 && base > maxReward) {
    if (resetOnMax) {
      isReset = true

      if (rewardMode === 'linear') {
        const cycle =
          streakIncrement > 0
            ? Math.floor((maxReward - baseReward) / streakIncrement) + 1
            : 1
        const newStreak = ((streak - 1) % cycle) + 1
        base = baseReward + (newStreak - 1) * streakIncrement
      } else {
        const cycle =
          streakMultiplier > 1
            ? Math.floor(
                Math.log(maxReward / baseReward) / Math.log(streakMultiplier)
              ) + 1
            : 1
        const newStreak = ((streak - 1) % cycle) + 1
        base = baseReward * Math.pow(streakMultiplier, newStreak - 1)
      }
    } else {
      base = maxReward
    }
  }

  const weekly = streak % 7 === 0 ? milestoneBonus.weekly : 0
  const monthly = streak % 28 === 0 ? milestoneBonus.monthly : 0

  return {
    base: Number(base.toFixed(2)),
    weekly,
    monthly,
    reward: Number((base + weekly + monthly).toFixed(2)),
    isReset
  }
}
