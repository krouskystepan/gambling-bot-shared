import z from 'zod'

import { num } from '../../common/zod'

export const paySettingsSchema = z.object({
  feePercent: num.pipe(z.number().min(0).max(1)),
  minAmount: num.pipe(z.number().min(0)),
  maxAmount: num.pipe(z.number().min(0)),
  maxDailyAmount: num.pipe(z.number().min(0))
})
