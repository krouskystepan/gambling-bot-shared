import type { ClientSession, Model } from 'mongoose'

import { getWithdrawableBalance } from '../../atm/previewWithdrawBalance'
import { validateBetAmount } from '../../casino/utils/validateBetAmount'
import { generateId } from '../../common/generateId'
import { guildCalendarRangeToUtc } from '../../guild/utils/guildTimezone'
import { getQuestDateKey } from '../../quests/utils/questDateKey'
import type { TTransaction } from '../../transactions/types/transaction'
import type { TUser } from '../../user/types/user'
import {
  USER_BANNED_ERROR,
  isUserBanned
} from '../../user/utils/userModeration'
import type { TPaySettings } from '../constants/defaultPaySettings'
import { calculateTransferFee } from '../utils/calculateTransferFee'

type PeerTransferModels = {
  userModel: Model<TUser>
  transactionModel: Model<TTransaction>
}

export type PeerTransferInput = {
  senderId: string
  receiverId: string
  guildId: string
  amount: number
  paySettings: TPaySettings
  timezone?: string | null
  now?: Date
}

export type PeerTransferResult = {
  referenceId: string
  gross: number
  fee: number
  net: number
  feePercent: number
  senderBalance: number
  receiverBalance: number
}

async function sumTodayTransferOut(
  transactionModel: Model<TTransaction>,
  {
    guildId,
    senderId,
    timezone,
    now,
    session
  }: {
    guildId: string
    senderId: string
    timezone?: string | null
    now: Date
    session: ClientSession
  }
): Promise<number> {
  const day = getQuestDateKey(now, timezone)
  const { start, end } = guildCalendarRangeToUtc(day, day, timezone)

  const rows = await transactionModel
    .aggregate<{ total: number }>([
      {
        $match: {
          guildId,
          userId: senderId,
          type: 'transfer_out',
          createdAt: { $gte: start, $lte: end }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
    .session(session)

  return rows[0]?.total ?? 0
}

export function createPeerTransferService({
  userModel,
  transactionModel
}: PeerTransferModels) {
  async function transfer(
    input: PeerTransferInput
  ): Promise<PeerTransferResult> {
    const {
      senderId,
      receiverId,
      guildId,
      amount,
      paySettings,
      timezone,
      now = new Date()
    } = input

    if (senderId === receiverId) {
      throw new Error('SELF_TRANSFER')
    }

    const amountCheck = validateBetAmount(
      amount,
      paySettings.maxAmount,
      paySettings.minAmount
    )
    if (!amountCheck.ok) {
      throw new Error(amountCheck.error)
    }

    const { feePercent, feeAmount, netAmount, grossAmount } =
      calculateTransferFee(amount, paySettings.feePercent)

    const referenceId = generateId('pay')
    let senderBalance = 0
    let receiverBalance = 0

    const session = await userModel.db.startSession()

    try {
      await session.withTransaction(async () => {
        if (paySettings.maxDailyAmount > 0) {
          const todayVolume = await sumTodayTransferOut(transactionModel, {
            guildId,
            senderId,
            timezone,
            now,
            session
          })

          if (todayVolume + grossAmount > paySettings.maxDailyAmount) {
            throw new Error('DAILY_CAP_EXCEEDED')
          }
        }

        const [sender, receiver] = await Promise.all([
          userModel.findOne({ userId: senderId, guildId }).session(session),
          userModel.findOne({ userId: receiverId, guildId }).session(session)
        ])

        if (!sender) throw new Error('SENDER_NOT_FOUND')
        if (!receiver) throw new Error('RECEIVER_NOT_FOUND')
        if (isUserBanned(sender) || isUserBanned(receiver)) {
          throw new Error(USER_BANNED_ERROR)
        }

        const locked = sender.lockedBalance ?? 0
        const withdrawable = getWithdrawableBalance(sender.balance, locked)

        if (sender.balance < grossAmount) {
          throw new Error('INSUFFICIENT_FUNDS')
        }
        if (withdrawable < grossAmount) {
          throw new Error('INSUFFICIENT_WITHDRAWABLE')
        }

        const debit = await userModel.updateOne(
          {
            userId: senderId,
            guildId,
            $expr: {
              $gte: [
                {
                  $subtract: ['$balance', { $ifNull: ['$lockedBalance', 0] }]
                },
                grossAmount
              ]
            }
          },
          { $inc: { balance: -grossAmount } },
          { session }
        )

        if (debit.modifiedCount === 0) {
          throw new Error('INSUFFICIENT_WITHDRAWABLE')
        }

        const credit = await userModel.updateOne(
          { userId: receiverId, guildId },
          { $inc: { balance: netAmount } },
          { session }
        )

        if (credit.modifiedCount === 0) {
          throw new Error('RECEIVER_NOT_FOUND')
        }

        const meta = {
          counterpartyId: receiverId,
          grossAmount,
          feeAmount,
          feePercent,
          netAmount
        }

        const receiverMeta = {
          counterpartyId: senderId,
          grossAmount,
          feeAmount,
          feePercent,
          netAmount
        }

        await transactionModel.create(
          [
            {
              userId: senderId,
              guildId,
              amount: grossAmount,
              type: 'transfer_out',
              source: 'command',
              referenceId,
              meta
            },
            {
              userId: receiverId,
              guildId,
              amount: netAmount,
              type: 'transfer_in',
              source: 'command',
              referenceId,
              meta: receiverMeta
            }
          ],
          { session }
        )

        const [updatedSender, updatedReceiver] = await Promise.all([
          userModel.findOne({ userId: senderId, guildId }).session(session),
          userModel.findOne({ userId: receiverId, guildId }).session(session)
        ])

        senderBalance = updatedSender?.balance ?? sender.balance - grossAmount
        receiverBalance =
          updatedReceiver?.balance ?? receiver.balance + netAmount
      })
    } finally {
      session.endSession()
    }

    return {
      referenceId,
      gross: grossAmount,
      fee: feeAmount,
      net: netAmount,
      feePercent,
      senderBalance,
      receiverBalance
    }
  }

  return { transfer }
}

export type PeerTransferService = ReturnType<typeof createPeerTransferService>
