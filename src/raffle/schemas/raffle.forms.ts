import z from 'zod'

export const raffleChannelsFormSchema = z.object({
  actions: z.string(),
  logs: z.string()
})

export const raffleCreateFormSchema = z.object({
  ticketPrice: z.string().min(1),
  maxTickets: z.number().int().min(1).max(100),
  drawTime: z.string().min(1),
  interval: z.string().min(2)
})
