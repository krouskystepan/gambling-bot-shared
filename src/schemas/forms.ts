import z from 'zod'

import { COMMON_TIMEZONES } from '../constants/commonTimezones'
import {
  BONUS_MAX_AMOUNT,
  BONUS_MAX_STREAK_MULTIPLIER
} from '../constants/bonusLimits'
import { normalizePlinkoBinMultipliers } from '../constants/plinkoConfig'

const NO_CHANNEL = 'At least one channel must be selected.'

export const atmChannelsFormSchema = z.object({
  actions: z.string().min(1, { message: NO_CHANNEL }),
  logs: z.string().min(1, { message: NO_CHANNEL })
})

export const casinoChannelsFormSchema = z.object({
  casinoChannelIds: z
    .array(z.string().min(1, { message: NO_CHANNEL }))
    .min(1, { message: NO_CHANNEL })
})

export const predictionChannelsFormSchema = z.object({
  actions: z.string().min(1, { message: NO_CHANNEL }),
  logs: z.string().min(1, { message: NO_CHANNEL })
})

export const raffleChannelsFormSchema = z.object({
  actions: z.string().min(1, { message: NO_CHANNEL }),
  logs: z.string().min(1, { message: NO_CHANNEL })
})

export const channelsFormSchema = z.object({
  atm: atmChannelsFormSchema,
  casino: casinoChannelsFormSchema,
  prediction: predictionChannelsFormSchema,
  raffle: raffleChannelsFormSchema
})

const num = z
  .union([z.number(), z.string()])
  .transform((val) => {
    if (val === '' || val === undefined || val === null) return 0
    const parsed = typeof val === 'string' ? Number(val) : val
    return Number.isNaN(parsed) ? 0 : parsed
  })
  .pipe(z.number())

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
  })
})

export const vipSettingsFormSchema = z.object({
  roleOwnerId: z.string().min(1, 'Select a Owner VIP role'),
  roleMemberId: z.string().min(1, 'Select a Member VIP role'),
  pricePerDay: z.number().min(0, 'Must be ≥ 0'),
  pricePerCreate: z.number().min(0, 'Must be ≥ 0'),
  pricePerAdditionalMember: z.number().min(0, 'Must be ≥ 0'),
  maxMembers: z.number().min(0, 'Must be ≥ 0'),
  categoryId: z.string().min(1, 'Select a category')
})

export const managerRoleFormSchema = z.object({
  managerRoleId: z.string().min(1, 'Select a manager role')
})

const bonusAmountSchema = z
  .number()
  .min(0, 'Must be ≥ 0')
  .max(BONUS_MAX_AMOUNT, `Must be ≤ ${BONUS_MAX_AMOUNT.toLocaleString()}`)

const bonusMultiplierSchema = z
  .number()
  .min(0, 'Must be ≥ 0')
  .max(BONUS_MAX_STREAK_MULTIPLIER, `Must be ≤ ${BONUS_MAX_STREAK_MULTIPLIER}`)
  .optional()

const bonusMultiplierInputSchema = z
  .union([z.number(), z.string()])
  .optional()
  .transform((val) => {
    if (val === '' || val === undefined || val === null) return undefined
    const num = typeof val === 'string' ? Number(val) : val
    return Number.isNaN(num) ? undefined : num
  })
  .pipe(bonusMultiplierSchema)

export const globalSettingsFormSchema = z.object({
  disableRegistrations: z.boolean(),
  disableDeposits: z.boolean(),
  disableWithdrawals: z.boolean(),
  disableCasinoGames: z.boolean(),
  disableCasinoGamesForMods: z.boolean(),
  disablePredictions: z.boolean(),
  disablePredictionManagement: z.boolean(),
  disableRaffles: z.boolean(),
  disableRaffleManagement: z.boolean(),
  disableDailyBonus: z.boolean(),
  disableVip: z.boolean(),
  maintenanceMode: z.boolean(),
  timezone: z.enum(COMMON_TIMEZONES),
  currencySymbol: z
    .string()
    .max(8)
    .refine((value) => value.trim().length > 0, {
      message: 'Currency symbol is required'
    }),
  currencyPlacement: z.enum(['prefix', 'suffix'])
})

export const bonusFormSchema = z.object({
  rewardMode: z.enum(['linear', 'exponential']),
  baseReward: bonusAmountSchema,
  streakIncrement: bonusAmountSchema.optional(),
  streakMultiplier: bonusMultiplierInputSchema,
  maxReward: bonusAmountSchema,
  resetOnMax: z.boolean(),
  milestoneBonus: z.object({
    weekly: bonusAmountSchema,
    monthly: bonusAmountSchema
  })
})
