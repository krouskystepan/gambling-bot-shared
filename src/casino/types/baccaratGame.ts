import type { BaccaratBetSide, BaccaratCard } from '../constants/baccaratConfig'
import type { CasinoSessionStats } from './casinoSessionStats'

export type BaccaratSessionPhase = 'waiting' | 'dealing' | 'result'

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
  gameId: string
  /** Set only while a round is reserved and not yet settled. */
  activeBetId?: string | null
  betAmount: number | null
  /** Last settled side; used for Rebet. */
  lastSide?: BaccaratBetSide | null
  showBalance: boolean
  skipAnimations: boolean
  phase: BaccaratSessionPhase
  pendingDeal?: TBaccaratPendingDeal | null
  sessionStats: CasinoSessionStats

  idleNudgeSentAt?: Date | null

  createdAt: Date
  updatedAt: Date
}
