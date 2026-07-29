export const QUEST_MAX_REWARD_AMOUNT = 1_000_000
export const QUEST_MAX_THRESHOLD = 1_000_000
export const QUEST_MAX_NAME_LENGTH = 64
export const QUEST_MAX_DESCRIPTION_LENGTH = 256

export const QUEST_CONDITION_TYPES = [
  'casino_wins',
  'casino_bets',
  'casino_winnings',
  'net_profit',
  'bonus_claims',
  'bonus_streak',
  'vip_purchase'
] as const

export const QUEST_KINDS = ['daily', 'normal'] as const

/** Which quest kinds each condition type may be used with. */
export const QUEST_CONDITION_ALLOWED_KINDS = {
  casino_wins: ['daily', 'normal'],
  casino_bets: ['daily', 'normal'],
  casino_winnings: ['daily', 'normal'],
  net_profit: ['daily', 'normal'],
  bonus_claims: ['daily', 'normal'],
  bonus_streak: ['normal'],
  vip_purchase: ['normal']
} as const satisfies Record<
  (typeof QUEST_CONDITION_TYPES)[number],
  readonly ('daily' | 'normal')[]
>
