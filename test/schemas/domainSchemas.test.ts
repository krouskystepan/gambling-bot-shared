import { atmChannelsFormSchema } from 'gambling-bot-shared/atm'
import { vipSettingsFormSchema } from 'gambling-bot-shared/vip'
import { describe, expect, it } from 'vitest'

describe('atm schemas', () => {
  it('accepts channel ids', () => {
    const result = atmChannelsFormSchema.safeParse({
      actions: '123',
      logs: '456'
    })
    expect(result.success).toBe(true)
  })
})

describe('vip schemas', () => {
  it('accepts vip settings form', () => {
    const result = vipSettingsFormSchema.safeParse({
      roleOwnerId: '1',
      roleMemberId: '2',
      pricePerDay: 10,
      pricePerCreate: 20,
      pricePerAdditionalMember: 5,
      maxMembers: 4,
      categoryId: 'cat'
    })
    expect(result.success).toBe(true)
  })
})
