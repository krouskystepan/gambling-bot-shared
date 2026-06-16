import z from 'zod'

import { num } from '../../common/zod'
import { normalizePlinkoBinMultipliers } from '../constants/plinkoConfig'

export const casinoChannelsFormSchema = z.object({
  casinoChannelIds: z.array(z.string()),
  winAnnouncementsChannelId: z.string()
})

export const casinoSettingsSchema = z.object({
  dice: z.object({
    winMultiplier: num,
    minBet: num,
    maxBet: num
  }),

  coinflip: z.object({
    winMultiplier: num,
    minBet: num,
    maxBet: num
  }),

  slots: z.object({
    winMultipliers: z.record(z.string(), num),
    symbolWeights: z.record(z.string(), num),
    minBet: num,
    maxBet: num
  }),

  lottery: z.object({
    winMultipliers: z.record(z.string(), num),
    minBet: num,
    maxBet: num
  }),

  roulette: z.object({
    winMultipliers: z.record(z.string(), num),
    minBet: num,
    maxBet: num
  }),

  rps: z.object({
    casinoCut: num,
    minBet: num,
    maxBet: num
  }),

  goldenJackpot: z.object({
    winMultiplier: num,
    oneInChance: num,
    minBet: num,
    maxBet: num
  }),

  blackjack: z.object({
    minBet: num,
    maxBet: num
  }),

  prediction: z.object({
    minBet: num,
    maxBet: num
  }),

  raffle: z.object({
    casinoCut: num
  }),

  plinko: z.object({
    binMultipliers: z
      .record(z.string(), num)
      .transform(normalizePlinkoBinMultipliers),
    minBet: num,
    maxBet: num
  }),

  winAnnouncements: z.object({
    plinkoMinMultiplier: num,
    goldenJackpotMinMultiplier: num,
    slotsMinMultiplier: num,
    lotteryMinMultiplier: num,
    rouletteMinMultiplier: num,
    blackjackMinMultiplier: num,
    diceMinMultiplier: num,
    coinflipMinMultiplier: num
  })
})
