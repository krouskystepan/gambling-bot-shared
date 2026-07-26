export type SlotsSessionPhase = 'ready' | 'result'

export type TSlotsGame = {
  userId: string
  guildId: string
  channelId: string
  messageId: string
  gameId: string
  showBalance: boolean
  skipAnimations: boolean
  /** Unit bet per spin; null until Change bet. */
  unitBet: number | null
  /** How many spins one Spin press runs (1-10). */
  spinsCount: number
  phase: SlotsSessionPhase
  lastReels?: string | null
  lastNetResult?: number | null
  lastSpinsCount?: number | null
  lastTotalBet?: number | null
  lastWinsCount?: number | null
  /** Set only while a batch is reserved and not yet settled. */
  activeBetId?: string | null
  lockedAmount?: number | null
  idleNudgeSentAt?: Date | null
  createdAt: Date
  updatedAt: Date
}
