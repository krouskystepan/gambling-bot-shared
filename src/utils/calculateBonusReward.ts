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

export const getBonusCycleLength = (
  rewardMode: BonusSettings['rewardMode'],
  baseReward: number,
  maxReward: number,
  streakIncrement: number,
  streakMultiplier: number
): number => {
  if (rewardMode === 'linear') {
    return streakIncrement > 0
      ? Math.floor((maxReward - baseReward) / streakIncrement) + 1
      : 1
  }

  return streakMultiplier > 1
    ? Math.floor(
        Math.log(maxReward / baseReward) / Math.log(streakMultiplier)
      ) + 1
    : 1
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

  if (maxReward > 0 && resetOnMax && base > maxReward) {
    const cycle = getBonusCycleLength(
      rewardMode,
      baseReward,
      maxReward,
      streakIncrement,
      streakMultiplier
    )
    const cycleStreak = ((streak - 1) % cycle) + 1

    isReset = streak > cycle && cycleStreak === 1

    base =
      rewardMode === 'linear'
        ? baseReward + (cycleStreak - 1) * streakIncrement
        : baseReward * Math.pow(streakMultiplier, cycleStreak - 1)
  } else if (maxReward > 0 && base > maxReward) {
    base = maxReward
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
