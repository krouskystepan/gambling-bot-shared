import type { BaccaratCard, BaccaratSlipBet } from '../constants/baccaratConfig'
import type { CasinoSessionStats } from './casinoSessionStats'

export type BaccaratSessionPhase = 'waiting' | 'dealing' | 'result'

/** Cards only - the reserved slip lives on `bets` while dealing. */
export type TBaccaratPendingDeal = {
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
  bets: BaccaratSlipBet[]
  lastBets: BaccaratSlipBet[]
  /** Reserved stake while dealing; prefer over summing `bets`. */
  lockedAmount?: number | null
  showBalance: boolean
  skipAnimations: boolean
  phase: BaccaratSessionPhase
  pendingDeal?: TBaccaratPendingDeal | null
  sessionStats: CasinoSessionStats

  idleNudgeSentAt?: Date | null

  createdAt: Date
  updatedAt: Date
}
