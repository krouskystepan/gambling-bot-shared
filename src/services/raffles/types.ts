import type { TRaffle } from '../../types/raffle'

export type TAddRaffleTickets = {
  raffleId: string
  guildId: string
  userId: string
  tickets: number
  maxTicketsPerUser: number
}

export type TUpsertRaffle = {
  raffleId: string
  drawId: string
  guildId: string
  creatorId: string
  channelId: string
  ticketPrice: number
  maxTicketsPerUser: number
  nextDrawAt: Date
  drawIntervalMs: number
}

export type CancelRaffleResult =
  | { ok: false; code: 'NOT_FOUND' }
  | { ok: true; raffle: TRaffle; refundErrors: string[] }
