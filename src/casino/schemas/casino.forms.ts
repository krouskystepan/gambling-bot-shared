import z from 'zod'

import { num } from '../../common/zod'
import { normalizePlinkoBinMultipliers } from '../constants/plinkoConfig'

export const casinoChannelsFormSchema = z.object({
  casinoChannelIds: z.array(z.string()),
  winAnnouncementsChannelId: z.string()
})

export const casinoSettingsSchema = z.object({
  dice: z.object({
    enabled: z.boolean(),
    winMultiplier: num,
    minBet: num,
    maxBet: num
  }),

  coinflip: z.object({
    enabled: z.boolean(),
    winMultiplier: num,
    minBet: num,
    maxBet: num
  }),

  hilo: z.object({
    enabled: z.boolean(),
    houseEdge: num,
    minBet: num,
    maxBet: num
  }),

  limbo: z.object({
    enabled: z.boolean(),
    houseEdge: num,
    minBet: num,
    maxBet: num
  }),

  slots: z.object({
    enabled: z.boolean(),
    winMultipliers: z.record(z.string(), num),
    symbolWeights: z.record(z.string(), num),
    minBet: num,
    maxBet: num
  }),

  lottery: z.object({
    enabled: z.boolean(),
    winMultipliers: z.record(z.string(), num),
    minBet: num,
    maxBet: num
  }),

  roulette: z.object({
    enabled: z.boolean(),
    winMultipliers: z.record(z.string(), num),
    minBet: num,
    maxBet: num
  }),

  baccarat: z.object({
    enabled: z.boolean(),
    winMultipliers: z.record(z.string(), num),
    dragonBonusMultipliers: z.record(z.string(), num),
    lucky6Multipliers: z.record(z.string(), num),
    minBet: num,
    maxBet: num
  }),

  rps: z.object({
    enabled: z.boolean(),
    houseEdge: num,
    minBet: num,
    maxBet: num
  }),

  goldenJackpot: z.object({
    enabled: z.boolean(),
    winMultiplier: num,
    oneInChance: num,
    minBet: num,
    maxBet: num
  }),

  blackjack: z.object({
    enabled: z.boolean(),
    winMultipliers: z.record(z.string(), num),
    pairsMultipliers: z.record(z.string(), num),
    plusThreeMultipliers: z.record(z.string(), num),
    deckCount: num,
    minBet: num,
    maxBet: num
  }),

  mines: z.object({
    enabled: z.boolean(),
    houseEdge: num,
    minBet: num,
    maxBet: num,
    minMines: num,
    maxMines: num
  }),

  prediction: z.object({
    enabled: z.boolean(),
    minBet: num,
    maxBet: num
  }),

  raffle: z.object({
    enabled: z.boolean(),
    houseEdge: num
  }),

  plinko: z.object({
    enabled: z.boolean(),
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
    baccaratMinMultiplier: num,
    blackjackMinMultiplier: num,
    minesMinMultiplier: num,
    diceMinMultiplier: num,
    coinflipMinMultiplier: num,
    hiloMinMultiplier: num,
    limboMinMultiplier: num
  })
})
