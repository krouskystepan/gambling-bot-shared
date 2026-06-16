import type { Model } from 'mongoose'

import type { CasinoGameId } from '../../constants/casinoGames'
import type { TTransaction } from '../../types/transaction'
import type { TUser } from '../../types/user'

type CasinoBetModels = {
  userModel: Model<TUser>
  transactionModel: Model<TTransaction>
}

export function createCasinoBetService({
  userModel,
  transactionModel
}: CasinoBetModels) {
  async function refundLockedBet({
    userId,
    guildId,
    amount,
    betId,
    game
  }: {
    userId: string
    guildId: string
    amount: number
    betId: string
    game: CasinoGameId
  }) {
    const session = await userModel.db.startSession()

    try {
      await session.withTransaction(async () => {
        const user = await userModel
          .findOne({ userId, guildId })
          .session(session)
        if (!user) throw new Error('USER_NOT_FOUND')

        if (user.lockedBalance < amount) {
          return
        }

        user.lockedBalance -= amount
        user.balance += amount

        await user.save({ session })

        await transactionModel.create(
          [
            {
              userId,
              guildId,
              amount,
              type: 'refund',
              source: 'casino',
              betId,
              meta: { game }
            }
          ],
          { session }
        )
      })
    } finally {
      session.endSession()
    }
  }

  async function settleCasinoWinnings({
    userId,
    guildId,
    totalBet,
    winnings,
    betId,
    game
  }: {
    userId: string
    guildId: string
    totalBet: number
    winnings: number
    betId: string
    game: CasinoGameId
  }) {
    const session = await userModel.db.startSession()

    try {
      let finalBalance = 0

      await session.withTransaction(async () => {
        const user = await userModel
          .findOne({ userId, guildId })
          .session(session)

        if (!user) throw new Error('USER_NOT_FOUND')

        if (user.lockedBalance < totalBet) {
          finalBalance = user.balance + user.lockedBalance
          return
        }

        user.lockedBalance -= totalBet

        if (winnings > 0) {
          const winExists = await transactionModel
            .exists({
              betId,
              type: 'win'
            })
            .session(session)

          if (!winExists) {
            user.balance += winnings

            await transactionModel.create(
              [
                {
                  userId,
                  guildId,
                  amount: winnings,
                  type: 'win',
                  source: 'casino',
                  betId,
                  meta: { game }
                }
              ],
              { session }
            )
          }
        }

        await user.save({ session })

        finalBalance = user.balance + user.lockedBalance
      })

      return finalBalance
    } finally {
      session.endSession()
    }
  }

  // Raffle cancellation refunds go to normal balance even if bonus funds were used.
  async function refundRafflePurchase({
    userId,
    guildId,
    amount,
    raffleId,
    game
  }: {
    userId: string
    guildId: string
    amount: number
    raffleId: string
    game: CasinoGameId
  }) {
    const session = await userModel.db.startSession()

    try {
      await session.withTransaction(async () => {
        const user = await userModel
          .findOne({ userId, guildId })
          .session(session)
        if (!user) throw new Error('USER_NOT_FOUND')

        user.balance += amount

        await user.save({ session })

        await transactionModel.create(
          [
            {
              userId,
              guildId,
              amount,
              type: 'refund',
              source: 'casino',
              betId: raffleId,
              meta: { game }
            }
          ],
          { session }
        )
      })
    } finally {
      session.endSession()
    }
  }

  async function payRaffleWinner({
    userId,
    guildId,
    amount,
    raffleId,
    game
  }: {
    userId: string
    guildId: string
    amount: number
    raffleId: string
    game: CasinoGameId
  }) {
    const session = await userModel.db.startSession()

    try {
      await session.withTransaction(async () => {
        const user = await userModel
          .findOne({ userId, guildId })
          .session(session)
        if (!user) throw new Error('USER_NOT_FOUND')

        user.balance += amount
        await user.save({ session })

        await transactionModel.create(
          [
            {
              userId,
              guildId,
              amount,
              type: 'win',
              source: 'casino',
              betId: raffleId,
              meta: { game }
            }
          ],
          { session }
        )
      })
    } finally {
      session.endSession()
    }
  }

  return {
    refundLockedBet,
    settleCasinoWinnings,
    refundRafflePurchase,
    payRaffleWinner
  }
}

export type CasinoBetService = ReturnType<typeof createCasinoBetService>
