import type { QuestKind, TQuest } from '../types/quest'

export type CompletedQuestGrant = {
  quest: TQuest
  progress: number
  rewardAmount: number
  kind: QuestKind
  dateKey: string | null
}

export type EvaluateAndGrantQuestsResult = {
  completed: CompletedQuestGrant[]
  questDailyStreak: number
}
