import { SUITES, VALUES } from '../constants/blackjack'

export type Suite = (typeof SUITES)[number]
export type CardLabel = (typeof VALUES)[number]['label']

export type Card = {
  suite: Suite
  label: CardLabel
  value: number
}

export type GamePhase = 'PLAYER' | 'DEALER' | 'FINISHED'

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
  betId: string

  deck: Card[]
  deckIndex: number

  hands: TBlackjackHand[]
  activeHandIndex: number
  phase: GamePhase

  dealerCards: Card[]

  idleNudgeSentAt?: Date | null

  createdAt: Date
  updatedAt: Date
}
