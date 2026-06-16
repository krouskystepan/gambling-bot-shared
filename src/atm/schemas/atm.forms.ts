import z from 'zod'

export const atmChannelsFormSchema = z.object({
  actions: z.string(),
  logs: z.string()
})
