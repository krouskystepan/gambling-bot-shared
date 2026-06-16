import z from 'zod'

export const vipSettingsFormSchema = z.object({
  roleOwnerId: z.string(),
  roleMemberId: z.string(),
  pricePerDay: z.number().min(0, 'Must be ≥ 0'),
  pricePerCreate: z.number().min(0, 'Must be ≥ 0'),
  pricePerAdditionalMember: z.number().min(0, 'Must be ≥ 0'),
  maxMembers: z.number().min(0, 'Must be ≥ 0'),
  categoryId: z.string()
})
