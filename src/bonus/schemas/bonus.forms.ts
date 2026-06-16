import z from 'zod'

import {
  BONUS_MAX_AMOUNT,
  BONUS_MAX_STREAK_MULTIPLIER
} from '../constants/bonusLimits'

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
