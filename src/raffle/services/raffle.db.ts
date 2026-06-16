import type { Model } from 'mongoose'

import type { TRaffle } from '../types/raffle'
import type { TAddRaffleTickets, TUpsertRaffle } from './types'

export function createRaffleDb(raffleModel: Model<TRaffle>) {
  const getRaffleById = async ({
    raffleId,
    guildId
  }: {
    raffleId: string
    guildId: string
  }) => {
    return raffleModel.findOne({ raffleId, guildId })
  }

  const upsertRaffle = async ({
    guildId,
    drawId,
    raffleId,
    creatorId,
    channelId,
    ticketPrice,
    maxTicketsPerUser,
    nextDrawAt,
    drawIntervalMs
  }: TUpsertRaffle) => {
    return raffleModel.findOneAndUpdate(
      { raffleId, guildId },
      {
        $set: {
          drawId,
          creatorId,
          channelId,
          ticketPrice,
          maxTicketsPerUser,
          nextDrawAt,
          drawIntervalMs
        }
      },
      {
        upsert: true,
        returnDocument: 'after'
      }
    )
  }

  const addRaffleTickets = async ({
    raffleId,
    guildId,
    userId,
    tickets,
    maxTicketsPerUser
  }: TAddRaffleTickets): Promise<boolean> => {
    const now = new Date()

    const updateExisting = await raffleModel.updateOne(
      {
        raffleId,
        guildId,
        status: 'active',
        nextDrawAt: { $gt: now },
        'participants.userId': userId,
        $expr: {
          $lte: [
            {
              $add: [
                {
                  $ifNull: [
                    {
                      $first: {
                        $map: {
                          input: {
                            $filter: {
                              input: '$participants',
                              as: 'p',
                              cond: { $eq: ['$$p.userId', userId] }
                            }
                          },
                          as: 'p',
                          in: '$$p.tickets'
                        }
                      }
                    },
                    0
                  ]
                },
                tickets
              ]
            },
            maxTicketsPerUser
          ]
        }
      },
      { $inc: { 'participants.$.tickets': tickets } }
    )

    if (updateExisting.modifiedCount > 0) return true

    const addNew = await raffleModel.updateOne(
      {
        raffleId,
        guildId,
        status: 'active',
        nextDrawAt: { $gt: now },
        participants: { $not: { $elemMatch: { userId } } },
        $expr: {
          $lte: [
            {
              $cond: [{ $gte: [tickets, 0] }, tickets, maxTicketsPerUser]
            },
            maxTicketsPerUser
          ]
        }
      },
      { $push: { participants: { userId, tickets } } }
    )

    return addNew.modifiedCount > 0
  }

  const cancelRaffleAtomic = async ({
    raffleId,
    guildId
  }: {
    raffleId: string
    guildId: string
  }) => {
    return raffleModel.findOneAndUpdate(
      { raffleId, guildId, status: { $ne: 'canceled' } },
      { $set: { status: 'canceled' } },
      { returnDocument: 'after' }
    )
  }

  const searchRafflesForAutocomplete = async ({
    guildId,
    query
  }: {
    guildId: string
    query: string
  }) => {
    return raffleModel.aggregate([
      {
        $match: {
          guildId,
          raffleId: { $regex: query, $options: 'i' },
          status: 'active'
        }
      },
      { $sort: { createdAt: -1 } },
      { $limit: 25 },
      {
        $addFields: {
          totalTickets: {
            $sum: {
              $map: {
                input: '$participants',
                as: 'p',
                in: '$$p.tickets'
              }
            }
          }
        }
      },
      {
        $addFields: {
          totalPot: { $multiply: ['$totalTickets', '$ticketPrice'] }
        }
      },
      {
        $project: {
          raffleId: 1,
          nextDrawAt: 1,
          ticketPrice: 1,
          maxTicketsPerUser: 1,
          totalPot: 1
        }
      }
    ])
  }

  const getRafflesReadyToDraw = async () => {
    return raffleModel.find({
      status: 'active',
      nextDrawAt: { $lte: new Date() }
    })
  }

  const completeRaffleDraw = async ({
    raffleId,
    nextDrawAt,
    lastDrawAt,
    drawId
  }: {
    raffleId: string
    nextDrawAt: Date
    lastDrawAt: Date
    drawId: string
  }) => {
    await raffleModel.updateOne(
      {
        raffleId,
        status: 'active'
      },
      {
        $set: {
          nextDrawAt,
          lastDrawAt,
          participants: [],
          drawId
        }
      }
    )
  }

  return {
    getRaffleById,
    upsertRaffle,
    addRaffleTickets,
    cancelRaffleAtomic,
    searchRafflesForAutocomplete,
    getRafflesReadyToDraw,
    completeRaffleDraw
  }
}

export type RaffleDb = ReturnType<typeof createRaffleDb>
