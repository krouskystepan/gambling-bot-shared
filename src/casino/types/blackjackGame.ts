import { SUITES, VALUES } from '../constants/blackjack'
import type { CasinoSessionStats } from './casinoSessionStats'

export type Suite = (typeof SUITES)[number]
export type CardLabel = (typeof VALUES)[number]['label']

export type Card = {
  suite: Suite
  label: CardLabel
  value: number
}

export type GamePhase = 'BETTING' | 'INSURANCE' | 'PLAYER' | 'DEALER' | 'RESULT'

export type PerfectPairsOutcome = 'perfect' | 'colored' | 'mixed' | 'loss'

/** 21+3 outcomes from player first two + dealer upcard (best hand wins). */
export type PlusThreeOutcome =
  | 'suitedTrips'
  | 'straightFlush'
  | 'threeOfAKind'
  | 'straight'
  | 'flush'
  | 'loss'

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
  baseBetAmount: number | null
  /** Session pairs stake for Deal/Rebet (like `baseBetAmount`). */
  basePairsBetAmount: number | null
  /** Locked pairs stake for the current round; cleared on settle. */
  activePairsBetAmount: number | null
  /** Session 21+3 stake for Deal/Rebet. */
  basePlusThreeBetAmount: number | null
  /** Locked 21+3 stake for the current round; cleared on settle. */
  activePlusThreeBetAmount: number | null
  /** Locked insurance for the current round; null if not offered / declined. */
  insuranceBetAmount: number | null
  /** Perfect Pairs classification for the current round; set at deal. */
  pairsOutcome: PerfectPairsOutcome | null
  /** 21+3 classification for the current round; set at deal. */
  plusThreeOutcome: PlusThreeOutcome | null
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
