import type { Suite } from './blackjackGame'

export type HiloStoredCard = {
  label: string
  suite: Suite
  rank: number
}

export type HiloGameStatus = 'WAITING' | 'SETTLING'

/**
 * One-shot Hi-Lo round. Exists only while the stake is locked waiting for a
 * guess (or timeout settlement). Deleted after settle.
 */
export type THiloGame = {
  userId: string
  guildId: string
  channelId: string
  messageId: string
  gameId: string
  /** Ledger reference while stake is locked (`gameId`). */
  activeBetId: string

  betAmount: number
  firstCard: HiloStoredCard
  /** Remaining deck after the first card was drawn (no replacement). */
  remainingDeck: HiloStoredCard[]
  houseEdgeSnapshot: number
  timeoutFeeSnapshot: number
  showBalance: boolean

  status: HiloGameStatus

  idleNudgeSentAt?: Date | null

  createdAt: Date
  updatedAt: Date
}
