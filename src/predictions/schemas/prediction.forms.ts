import z from 'zod'

import { num } from '../../common/zod'

export const predictionChannelsFormSchema = z.object({
  actions: z.string(),
  logs: z.string()
})

export const predictionChoiceSchema = z.object({
  choiceName: z.string().min(1),
  odds: num.pipe(z.number().positive())
})

export const createPredictionFormSchema = z.object({
  title: z.string().min(1).max(256),
  choices: z.array(predictionChoiceSchema).min(2).max(3),
  autolock: z.string().optional()
})

export const payoutPredictionFormSchema = z.object({
  winnerChoice: z.string().min(1)
})
