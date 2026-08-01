import type { CasinoSessionStats } from './casinoSessionStats'

export type MinesGameStatus = 'ACTIVE' | 'RESULT'

export type TMinesGame = {
  userId: string
  guildId: string
  channelId: string
  messageId: string
  gameId: string
  /** Set only while a board is reserved and not yet settled. */
  activeBetId?: string | null

  betAmount: number
  mineCount: number
  /** Cell indices 0..MINES_CELL_COUNT-1 that contain mines. */
  mineIndices: number[]
  /** Safely revealed cell indices (sorted ascending on write is optional). */
  revealedIndices: number[]
  /** House edge locked at game start for payout math. */
  houseEdgeSnapshot: number

  status: MinesGameStatus
  sessionStats: CasinoSessionStats
  showBalance: boolean

  idleNudgeSentAt?: Date | null

  createdAt: Date
  updatedAt: Date
}
