import type { TPrediction } from 'gambling-bot-shared/predictions'
import type { TRaffle } from 'gambling-bot-shared/raffle'

export const samplePrediction = (
  overrides: Partial<TPrediction> = {}
): TPrediction => ({
  predictionId: 'pred-1',
  guildId: 'guild-1',
  channelId: 'channel-1',
  creatorId: 'mod-1',
  title: 'Test prediction',
  choices: [
    {
      choiceName: 'Yes',
      odds: 2,
      bets: [{ userId: 'user-1', amount: 100, betId: 'bet-1' }]
    },
    {
      choiceName: 'No',
      odds: 1.5,
      bets: [{ userId: 'user-2', amount: 50, betId: 'bet-2' }]
    }
  ],
  status: 'ended',
  autolock: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  ...overrides
})

export const sampleRaffle = (overrides: Partial<TRaffle> = {}): TRaffle => ({
  drawId: 'draw-1',
  raffleId: 'raffle-1',
  guildId: 'guild-1',
  channelId: 'channel-1',
  creatorId: 'mod-1',
  ticketPrice: 10,
  maxTicketsPerUser: 5,
  nextDrawAt: new Date('2030-01-01T00:00:00Z'),
  drawIntervalMs: 86_400_000,
  status: 'canceled',
  participants: [
    { userId: 'user-1', tickets: 2 },
    { userId: 'user-2', tickets: 1 }
  ],
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  ...overrides
})
