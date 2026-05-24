import z from 'zod'

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

const num = z.number()

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
    binMultipliers: z.record(z.string(), num),
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

export const bonusFormSchema = z.object({
  rewardMode: z.enum(['linear', 'exponential']),
  baseReward: z.number().min(0),
  streakIncrement: z.number().min(0).optional(),
  streakMultiplier: z.number().min(0).optional(),
  maxReward: z.number().min(0),
  resetOnMax: z.boolean(),
  milestoneBonus: z.object({
    weekly: z.number().min(0),
    monthly: z.number().min(0)
  })
})
