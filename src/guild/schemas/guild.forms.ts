import z from 'zod'

import { atmChannelsFormSchema } from '../../atm/schemas/atm.forms'
import { casinoChannelsFormSchema } from '../../casino/schemas/casino.forms'
import { predictionChannelsFormSchema } from '../../predictions/schemas/prediction.forms'
import { raffleChannelsFormSchema } from '../../raffle/schemas/raffle.forms'
import { COMMON_TIMEZONES } from '../constants/commonTimezones'

export const channelsFormSchema = z.object({
  atm: atmChannelsFormSchema,
  casino: casinoChannelsFormSchema,
  prediction: predictionChannelsFormSchema,
  raffle: raffleChannelsFormSchema,
  workerLogChannelId: z.string()
})

export const managerRoleFormSchema = z.object({
  managerRoleId: z.string(),
  bannedRoleId: z.string()
})

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
