export type MinesGameStatus = 'ACTIVE' | 'FINISHED'

export type TMinesGame = {
  userId: string
  guildId: string
  channelId: string
  messageId: string
  betId: string

  betAmount: number
  mineCount: number
  /** Cell indices 0..MINES_CELL_COUNT-1 that contain mines. */
  mineIndices: number[]
  /** Safely revealed cell indices (sorted ascending on write is optional). */
  revealedIndices: number[]
  /** House edge locked at game start for payout math. */
  houseEdgeSnapshot: number

  status: MinesGameStatus

  idleNudgeSentAt?: Date | null

  createdAt: Date
  updatedAt: Date
}
