import { createRaffleLifecycleService } from 'gambling-bot-shared/raffle'
import { raffleCreateFormSchema } from 'gambling-bot-shared/raffle'
import { describe, expect, it, vi } from 'vitest'

import { sampleRaffle } from '../helpers/fixtures'

describe('createRaffleLifecycleService', () => {
  it('returns NOT_FOUND when raffle cancel fails', async () => {
    const lifecycle = createRaffleLifecycleService({
      raffleDb: {
        cancelRaffleAtomic: vi.fn().mockResolvedValue(null)
      } as never,
      casinoBet: { refundRafflePurchase: vi.fn() }
    })

    const result = await lifecycle.cancelRaffle({
      raffleId: 'raffle-1',
      guildId: 'guild-1'
    })

    expect(result).toEqual({ ok: false, code: 'NOT_FOUND' })
  })

  it('refunds participants on cancel', async () => {
    const raffle = sampleRaffle()
    const refundRafflePurchase = vi.fn().mockResolvedValue(undefined)

    const lifecycle = createRaffleLifecycleService({
      raffleDb: {
        cancelRaffleAtomic: vi.fn().mockResolvedValue(raffle)
      } as never,
      casinoBet: { refundRafflePurchase }
    })

    const result = await lifecycle.cancelRaffle({
      raffleId: 'raffle-1',
      guildId: 'guild-1'
    })

    expect(result.ok).toBe(true)
    expect(refundRafflePurchase).toHaveBeenCalledTimes(2)
  })

  it('collects refund errors without failing cancel', async () => {
    const raffle = sampleRaffle()
    const refundRafflePurchase = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('fail'))

    const lifecycle = createRaffleLifecycleService({
      raffleDb: {
        cancelRaffleAtomic: vi.fn().mockResolvedValue(raffle)
      } as never,
      casinoBet: { refundRafflePurchase }
    })

    const result = await lifecycle.cancelRaffle({
      raffleId: 'raffle-1',
      guildId: 'guild-1'
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.refundErrors).toEqual(['user-2'])
    }
  })

  it('skips zero-amount refunds', async () => {
    const raffle = sampleRaffle({
      ticketPrice: 0,
      participants: [{ userId: 'user-1', tickets: 5 }]
    })
    const refundRafflePurchase = vi.fn()

    const lifecycle = createRaffleLifecycleService({
      raffleDb: {
        cancelRaffleAtomic: vi.fn().mockResolvedValue(raffle)
      } as never,
      casinoBet: { refundRafflePurchase }
    })

    const result = await lifecycle.cancelRaffle({
      raffleId: 'raffle-1',
      guildId: 'guild-1'
    })

    expect(result.ok).toBe(true)
    expect(refundRafflePurchase).not.toHaveBeenCalled()
  })
})

describe('raffleCreateFormSchema', () => {
  it('accepts valid raffle form', () => {
    const result = raffleCreateFormSchema.safeParse({
      ticketPrice: '10',
      maxTickets: 50,
      drawTime: '2030-01-01T12:00:00Z',
      interval: '1d'
    })
    expect(result.success).toBe(true)
  })
})
