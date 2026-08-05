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
 * - WAITING: card-to-beat shown, stake locked until guess / cash-out / timeout
 * - SETTLING: claim lock while resolving a guess, cash-out, or timeout
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
  /** Card currently being guessed against (updates after each correct guess). */
  firstCard?: HiloStoredCard | null
  /** Remaining deck after cards drawn this streak (no replacement). */
  remainingDeck: HiloStoredCard[]
  /** Compound payout multiplier for the locked streak (starts at 1). */
  currentMultiplier: number
  /** Successful guesses this locked round. */
  streak: number
  houseEdgeSnapshot: number
  showBalance: boolean
  skipAnimations: boolean

  status: HiloGameStatus
  sessionStats: CasinoSessionStats

  idleNudgeSentAt?: Date | null

  createdAt: Date
  updatedAt: Date
}
