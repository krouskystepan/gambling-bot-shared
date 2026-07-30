import type { QuestCondition, QuestKind } from '../types/quest'

export type DefaultQuestTemplate = {
  /** Stable key for seed idempotency (matched against name). */
  name: string
  description: string
  kind: QuestKind
  condition: QuestCondition
  rewardAmount: number
  sortOrder: number
}

/** Example quests seeded by admin "Add defaults" - not auto-created on guild join. */
export const DEFAULT_QUEST_TEMPLATES: DefaultQuestTemplate[] = [
  {
    name: 'Win 3 Blackjack',
    description: 'Win 3 blackjack rounds today.',
    kind: 'daily',
    condition: { type: 'casino_wins', threshold: 3, game: 'blackjack' },
    rewardAmount: 500,
    sortOrder: 0
  },
  {
    name: 'Place 5 Bets',
    description: 'Place 5 casino bets today.',
    kind: 'daily',
    condition: { type: 'casino_bets', threshold: 5 },
    rewardAmount: 300,
    sortOrder: 1
  },
  {
    name: 'Claim Daily Bonus',
    description: 'Claim your daily bonus today.',
    kind: 'daily',
    condition: { type: 'bonus_claims', threshold: 1 },
    rewardAmount: 200,
    sortOrder: 2
  },
  {
    name: 'First Win',
    description: 'Win any casino game once.',
    kind: 'normal',
    condition: { type: 'casino_wins', threshold: 1 },
    rewardAmount: 1000,
    sortOrder: 10
  },
  {
    name: '7-Day Bonus Streak',
    description: 'Reach a 7-day /bonus claim streak.',
    kind: 'normal',
    condition: { type: 'bonus_streak', threshold: 7 },
    rewardAmount: 2000,
    sortOrder: 11
  },
  {
    name: 'First VIP',
    description: 'Purchase a VIP room.',
    kind: 'normal',
    condition: { type: 'vip_purchase', threshold: 1 },
    rewardAmount: 5000,
    sortOrder: 12
  }
]
