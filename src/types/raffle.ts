export type TRaffleStatus = 'active' | 'canceled'

export type TRaffleParticipant = {
  userId: string
  tickets: number
}

export type TRaffle = {
  drawId: string
  raffleId: string
  guildId: string
  channelId: string
  creatorId: string

  ticketPrice: number
  maxTicketsPerUser: number

  nextDrawAt: Date
  lastDrawAt?: Date
  drawIntervalMs: number

  status: TRaffleStatus

  participants: TRaffleParticipant[]

  createdAt: Date
  updatedAt: Date
}
