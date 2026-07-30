import { getPreviousQuestDateKey } from './questDateKey'

/**
 * Streak after completing ≥1 daily quest on `todayDateKey`.
 * Continues if last completion was yesterday; stays put if already today; else resets to 1.
 */
export const getQuestDailyStreakAfterCompletion = (
  lastQuestDailyCompleteDate: string | null | undefined,
  todayDateKey: string,
  currentStreak: number,
  timezone?: string | null
): number => {
  if (lastQuestDailyCompleteDate === todayDateKey) {
    return Math.max(1, currentStreak)
  }

  if (!lastQuestDailyCompleteDate) {
    return 1
  }

  const yesterday = getPreviousQuestDateKey(todayDateKey, timezone)
  if (lastQuestDailyCompleteDate === yesterday) {
    return Math.max(1, currentStreak) + 1
  }

  return 1
}
