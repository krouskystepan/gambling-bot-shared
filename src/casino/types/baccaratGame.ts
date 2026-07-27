import type { BaccaratBetSide, BaccaratCard } from '../constants/baccaratConfig'

export type BaccaratSessionPhase = 'waiting' | 'dealing'

export type TBaccaratPendingDeal = {
  side: BaccaratBetSide
  playerCards: BaccaratCard[]
  bankerCards: BaccaratCard[]
}

export type TBaccaratGame = {
  userId: string
  guildId: string
  channelId: string
  messageId: string
  betId: string
  betAmount: number
  showBalance: boolean
  skipAnimations: boolean
  phase: BaccaratSessionPhase
  pendingDeal?: TBaccaratPendingDeal | null

  idleNudgeSentAt?: Date | null

  createdAt: Date
  updatedAt: Date
}
