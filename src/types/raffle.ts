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

  status: 'active' | 'canceled'

  participants: {
    userId: string
    tickets: number
  }[]

  createdAt: Date
  updatedAt: Date
}
