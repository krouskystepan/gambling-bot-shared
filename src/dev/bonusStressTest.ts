import type { BonusSettings } from '../bonus/types/bonus'
import {
  calculateBonusReward,
  getBonusCycleLength
} from '../bonus/utils/calculateBonusReward'
import type { PreviewDay } from '../bonus/utils/generateBonusPreview'
import { yieldToEventLoop } from './yieldToEventLoop'

export type BonusStressSummary = {
  days: number
  totalReward: number
  avgReward: number
  maxReward: number
  maxDay: number
  resetCount: number
  weeklyBonuses: number
  monthlyBonuses: number
  cycleLength: number
  elapsedMs: number
}

export type BonusStressResult = BonusStressSummary & {
  preview: PreviewDay[]
}

const summarizePreview = (
  preview: PreviewDay[],
  settings: BonusSettings,
  elapsedMs: number
): BonusStressResult => {
  let totalReward = 0
  let maxReward = 0
  let maxDay = 1
  let resetCount = 0
  let weeklyBonuses = 0
  let monthlyBonuses = 0

  for (const day of preview) {
    totalReward += day.reward
    if (day.reward > maxReward) {
      maxReward = day.reward
      maxDay = day.day
    }
    if (day.isReset) resetCount++
    if (day.weekly > 0) weeklyBonuses++
    if (day.monthly > 0) monthlyBonuses++
  }

  const cycleLength = getBonusCycleLength(
    settings.rewardMode,
    settings.baseReward,
    settings.maxReward,
    settings.streakIncrement ?? 0,
    settings.streakMultiplier ?? 1
  )

  return {
    days: preview.length,
    totalReward: Number(totalReward.toFixed(2)),
    avgReward: preview.length
      ? Number((totalReward / preview.length).toFixed(2))
      : 0,
    maxReward,
    maxDay,
    resetCount,
    weeklyBonuses,
    monthlyBonuses,
    cycleLength,
    elapsedMs,
    preview
  }
}

export async function runBonusStressTest(
  settings: BonusSettings,
  days: number,
  onProgress?: (completed: number, total: number) => void,
  chunkSize = 5_000
): Promise<BonusStressResult> {
  const started = performance.now()
  const preview: PreviewDay[] = []
  let completed = 0

  while (completed < days) {
    const batch = Math.min(chunkSize, days - completed)

    for (let i = 0; i < batch; i++) {
      const day = completed + i + 1
      const reward = calculateBonusReward({ streak: day, settings })
      preview.push({
        day,
        reward: reward.reward,
        base: reward.base,
        weekly: reward.weekly,
        monthly: reward.monthly,
        isReset: reward.isReset
      })
    }

    completed += batch
    onProgress?.(completed, days)
    await yieldToEventLoop()
  }

  return summarizePreview(
    preview,
    settings,
    Math.round(performance.now() - started)
  )
}
