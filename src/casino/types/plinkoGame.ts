import type { CasinoSessionStats } from './casinoSessionStats'

export type PlinkoSessionPhase = 'ready' | 'dropping' | 'result'

export type TPlinkoGame = {
  userId: string
  guildId: string
  channelId: string
  messageId: string
  gameId: string
  showBalance: boolean
  skipAnimations: boolean
  /** Unit bet per ball; null until Change bet. */
  unitBet: number | null
  /** How many balls one Drop press runs (1-10). */
  ballsCount: number
  phase: PlinkoSessionPhase
  lastNetResult?: number | null
  lastBallsCount?: number | null
  lastTotalBet?: number | null
  lastWinsCount?: number | null
  /** Predetermined ball paths for an in-flight batch. */
  pendingBatchResults?: number[][] | null
  /** Set only while a batch is reserved and not yet settled. */
  activeBetId?: string | null
  lockedAmount?: number | null
  sessionStats: CasinoSessionStats
  idleNudgeSentAt?: Date | null
  createdAt: Date
  updatedAt: Date
}
