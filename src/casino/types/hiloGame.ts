import type { Suite } from './blackjackGame'
import type { CasinoSessionStats } from './casinoSessionStats'

export type HiloStoredCard = {
  label: string
  suite: Suite
  rank: number
}

/**
 * Durable Hi-Lo table session:
 * - BETTING: set stake, then Deal
 * - WAITING: first card shown, stake locked until guess / timeout
 * - SETTLING: claim lock while resolving a guess or timeout
 * - RESULT: between rounds (Rebet / Change / Close)
 */
export type HiloGameStatus = 'BETTING' | 'WAITING' | 'SETTLING' | 'RESULT'

export type THiloGame = {
  userId: string
  guildId: string
  channelId: string
  messageId: string
  gameId: string
  /** Set only while a round is reserved and not yet settled. */
  activeBetId?: string | null

  betAmount: number | null
  firstCard?: HiloStoredCard | null
  /** Remaining deck after the first card was drawn (no replacement). */
  remainingDeck: HiloStoredCard[]
  houseEdgeSnapshot: number
  showBalance: boolean

  status: HiloGameStatus
  sessionStats: CasinoSessionStats

  idleNudgeSentAt?: Date | null

  createdAt: Date
  updatedAt: Date
}
