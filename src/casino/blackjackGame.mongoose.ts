import { Schema } from 'mongoose'

import { TBlackjackGame, TBlackjackHand } from './types/blackjackGame'

const cardSchema = {
  suite: { type: String, required: true },
  label: { type: String, required: true },
  value: { type: Number, required: true }
}

const handSchema = new Schema<TBlackjackHand>(
  {
    cards: [cardSchema],
    betAmount: { type: Number, required: true },
    finished: { type: Boolean, required: true, default: false },
    isSplitHand: { type: Boolean, required: true, default: false }
  },
  { _id: false }
)

const sessionStatsSchema = new Schema(
  {
    roundsPlayed: { type: Number, required: true, default: 0 },
    totalWagered: { type: Number, required: true, default: 0 },
    totalPayout: { type: Number, required: true, default: 0 },
    netProfit: { type: Number, required: true, default: 0 }
  },
  { _id: false }
)

export const BlackjackGameSchema = new Schema<TBlackjackGame>(
  {
    userId: { type: String, required: true, index: true },
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, required: true },
    messageId: { type: String, required: true },
    gameId: { type: String, required: true, index: true },
    activeBetId: { type: String, default: null, index: true },
    baseBetAmount: { type: Number, default: null },
    basePairsBetAmount: { type: Number, default: null },
    activePairsBetAmount: { type: Number, default: null },
    basePlusThreeBetAmount: { type: Number, default: null },
    activePlusThreeBetAmount: { type: Number, default: null },
    insuranceBetAmount: { type: Number, default: null },
    pairsOutcome: {
      type: String,
      enum: ['perfect', 'colored', 'mixed', 'loss'],
      default: null
    },
    plusThreeOutcome: {
      type: String,
      enum: [
        'suitedTrips',
        'straightFlush',
        'threeOfAKind',
        'straight',
        'flush',
        'loss'
      ],
      default: null
    },
    showBalance: { type: Boolean, required: true, default: false },
    skipAnimations: { type: Boolean, required: true, default: false },

    deck: [cardSchema],
    deckIndex: { type: Number, required: true, default: 0 },

    hands: { type: [handSchema], required: true, default: [] },
    phase: {
      type: String,
      enum: ['BETTING', 'INSURANCE', 'PLAYER', 'DEALER', 'RESULT'],
      required: true,
      default: 'BETTING'
    },
    activeHandIndex: { type: Number, required: true, default: 0 },

    dealerCards: [cardSchema],

    sessionStats: {
      type: sessionStatsSchema,
      required: true,
      default: () => ({
        roundsPlayed: 0,
        totalWagered: 0,
        totalPayout: 0,
        netProfit: 0
      })
    },
    idleNudgeSentAt: { type: Date, default: null }
  },
  { timestamps: true }
)

BlackjackGameSchema.index({ userId: 1, guildId: 1 }, { unique: true })
