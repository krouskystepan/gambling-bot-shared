import type { RouletteBetType } from '../utils/calculateRouletteWin'
import type { CasinoSessionStats } from './casinoSessionStats'

export type TRouletteSlipBet = {
  amount: number
  type: RouletteBetType
  value: string
  displayValue: string
}

export type RouletteSessionPhase = 'betting' | 'spinning' | 'result'

export type TRouletteGame = {
  userId: string
  guildId: string
  channelId: string
  messageId: string
  gameId: string
  showBalance: boolean
  skipAnimations: boolean
  phase: RouletteSessionPhase
  bets: TRouletteSlipBet[]
  lastBets: TRouletteSlipBet[]
  lastSpinResult?: string | null
  pendingSpinResult?: string | null
  lastNetResult?: number | null
  /** Set only while a spin is reserved and not yet settled. */
  activeBetId?: string | null
  lockedAmount?: number | null
  sessionStats: CasinoSessionStats
  idleNudgeSentAt?: Date | null
  createdAt: Date
  updatedAt: Date
}
