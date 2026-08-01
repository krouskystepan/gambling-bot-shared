import { SUITES, VALUES } from '../constants/blackjack'
import type { CasinoSessionStats } from './casinoSessionStats'

export type Suite = (typeof SUITES)[number]
export type CardLabel = (typeof VALUES)[number]['label']

export type Card = {
  suite: Suite
  label: CardLabel
  value: number
}

export type GamePhase = 'PLAYER' | 'DEALER' | 'RESULT'

export type TBlackjackHand = {
  cards: Card[]
  betAmount: number
  finished: boolean
  isSplitHand: boolean
}

export type TBlackjackGame = {
  userId: string
  guildId: string
  channelId: string
  messageId: string
  gameId: string
  /** Set only while a hand is reserved and not yet settled. */
  activeBetId?: string | null
  baseBetAmount: number
  showBalance: boolean
  skipAnimations: boolean

  deck: Card[]
  deckIndex: number

  hands: TBlackjackHand[]
  activeHandIndex: number
  phase: GamePhase

  dealerCards: Card[]

  sessionStats: CasinoSessionStats
  idleNudgeSentAt?: Date | null

  createdAt: Date
  updatedAt: Date
}
