import {
  calculateTransferFee,
  createPeerTransferService,
  defaultPaySettings,
  normalizePaySettings,
  paySettingsSchema
} from 'gambling-bot-shared/pay'
import { USER_BANNED_ERROR } from 'gambling-bot-shared/user'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('calculateTransferFee', () => {
  it('computes cents-safe fee and net', () => {
    expect(calculateTransferFee(1000, 0.02)).toEqual({
      grossAmount: 1000,
      feePercent: 0.02,
      feeAmount: 20,
      netAmount: 980
    })
  })

  it('handles 0% and 100% fee edges', () => {
    expect(calculateTransferFee(100, 0)).toMatchObject({
      feeAmount: 0,
      netAmount: 100
    })
    expect(calculateTransferFee(100, 1)).toMatchObject({
      feeAmount: 100,
      netAmount: 0
    })
  })

  it('clamps fee percent to [0, 1]', () => {
    expect(calculateTransferFee(50, -0.5).feePercent).toBe(0)
    expect(calculateTransferFee(50, 1.5).feePercent).toBe(1)
  })

  it('rounds fee to cents', () => {
    expect(calculateTransferFee(33.33, 0.1)).toEqual({
      grossAmount: 33.33,
      feePercent: 0.1,
      feeAmount: 3.33,
      netAmount: 30
    })
  })
})

describe('normalizePaySettings', () => {
  it('returns defaults for empty input', () => {
    expect(normalizePaySettings(undefined)).toEqual(defaultPaySettings)
    expect(normalizePaySettings(null)).toEqual(defaultPaySettings)
  })

  it('clamps fee and coerces numbers', () => {
    expect(
      normalizePaySettings({
        feePercent: 2 as unknown as number,
        minAmount: '10' as unknown as number,
        maxAmount: -5,
        maxDailyAmount: 'bad' as unknown as number
      })
    ).toEqual({
      feePercent: 1,
      minAmount: 10,
      maxAmount: 0,
      maxDailyAmount: defaultPaySettings.maxDailyAmount
    })
    expect(
      normalizePaySettings({
        minAmount: '' as unknown as number,
        feePercent: '-0.1' as unknown as number
      })
    ).toMatchObject({
      minAmount: defaultPaySettings.minAmount,
      feePercent: 0
    })
  })
})

describe('paySettingsSchema', () => {
  it('parses defaults and rejects invalid fee', () => {
    expect(paySettingsSchema.safeParse(defaultPaySettings).success).toBe(true)
    expect(
      paySettingsSchema.safeParse({ ...defaultPaySettings, feePercent: 2 })
        .success
    ).toBe(false)
  })
})

type FakeUser = {
  userId: string
  guildId: string
  balance: number
  lockedBalance: number
  banned: boolean
}

function createFakeModels(users: FakeUser[]) {
  const store = new Map(
    users.map((u) => [`${u.guildId}:${u.userId}`, { ...u }])
  )
  const transferOuts: { userId: string; guildId: string; amount: number }[] = []

  const session = {
    endSession: vi.fn(),
    withTransaction: async (fn: () => Promise<void>) => {
      await fn()
    }
  }

  const userModel = {
    db: {
      startSession: vi.fn(async () => session)
    },
    findOne: vi.fn(
      ({ userId, guildId }: { userId: string; guildId: string }) => {
        const doc = store.get(`${guildId}:${userId}`) ?? null
        return {
          session: () => Promise.resolve(doc ? { ...doc } : null)
        }
      }
    ),
    updateOne: vi.fn(
      async (
        filter: {
          userId: string
          guildId: string
          $expr?: unknown
        },
        update: { $inc: { balance: number } }
      ) => {
        const key = `${filter.guildId}:${filter.userId}`
        const user = store.get(key)
        if (!user) return { modifiedCount: 0 }

        if (filter.$expr) {
          const available = user.balance - (user.lockedBalance ?? 0)
          const debit = -update.$inc.balance
          if (available < debit) return { modifiedCount: 0 }
        }

        user.balance += update.$inc.balance
        return { modifiedCount: 1 }
      }
    )
  }

  const transactionModel = {
    aggregate: vi.fn(() => ({
      session: async () => {
        const total = transferOuts
          .filter((t) => t.guildId === users[0]?.guildId)
          .reduce((sum, t) => sum + t.amount, 0)
        return total > 0 ? [{ total }] : []
      }
    })),
    create: vi.fn(
      async (
        docs: Array<{
          userId: string
          type: string
          amount: number
          guildId: string
        }>
      ) => {
        for (const doc of docs) {
          if (doc.type === 'transfer_out') {
            transferOuts.push({
              userId: doc.userId,
              guildId: doc.guildId,
              amount: doc.amount
            })
          }
        }
        return docs
      }
    )
  }

  return {
    userModel,
    transactionModel,
    store,
    transferOuts,
    setDailyVolume: (amount: number) => {
      transferOuts.length = 0
      transferOuts.push({
        userId: users[0].userId,
        guildId: users[0].guildId,
        amount
      })
    }
  }
}

describe('createPeerTransferService', () => {
  const guildId = 'g1'
  const senderId = 's1'
  const receiverId = 'r1'

  let models: ReturnType<typeof createFakeModels>
  let service: ReturnType<typeof createPeerTransferService>

  beforeEach(() => {
    models = createFakeModels([
      {
        userId: senderId,
        guildId,
        balance: 5000,
        lockedBalance: 0,
        banned: false
      },
      {
        userId: receiverId,
        guildId,
        balance: 100,
        lockedBalance: 0,
        banned: false
      }
    ])
    service = createPeerTransferService({
      userModel: models.userModel as never,
      transactionModel: models.transactionModel as never
    })
  })

  const baseInput = {
    senderId,
    receiverId,
    guildId,
    amount: 1000,
    paySettings: defaultPaySettings,
    timezone: 'UTC',
    now: new Date('2026-07-30T12:00:00.000Z')
  }

  it('transfers with fee on happy path', async () => {
    const result = await service.transfer(baseInput)

    expect(result.gross).toBe(1000)
    expect(result.fee).toBe(20)
    expect(result.net).toBe(980)
    expect(result.referenceId).toMatch(/^pay-/)
    expect(result.senderBalance).toBe(4000)
    expect(result.receiverBalance).toBe(1080)

    expect(models.transactionModel.create).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'transfer_out',
          amount: 1000,
          source: 'command'
        }),
        expect.objectContaining({
          type: 'transfer_in',
          amount: 980,
          source: 'command'
        })
      ]),
      expect.anything()
    )
  })

  it('rejects self-pay', async () => {
    await expect(
      service.transfer({ ...baseInput, receiverId: senderId })
    ).rejects.toThrow('SELF_TRANSFER')
  })

  it('rejects invalid / below-minimum amounts', async () => {
    await expect(
      service.transfer({ ...baseInput, amount: 0.5 })
    ).rejects.toThrow('BELOW_MINIMUM')
    await expect(
      service.transfer({ ...baseInput, amount: Number.NaN })
    ).rejects.toThrow('INVALID_NUMBER')
    await expect(
      service.transfer({ ...baseInput, amount: 1.234 })
    ).rejects.toThrow('TOO_MANY_DECIMALS')
  })

  it('enforces min/max amount settings', async () => {
    await expect(
      service.transfer({
        ...baseInput,
        amount: 50,
        paySettings: { ...defaultPaySettings, minAmount: 100 }
      })
    ).rejects.toThrow('BELOW_MIN_BET')

    await expect(
      service.transfer({
        ...baseInput,
        amount: 2000,
        paySettings: { ...defaultPaySettings, maxAmount: 500 }
      })
    ).rejects.toThrow('ABOVE_MAXIMUM')
  })

  it('rejects insufficient and locked funds', async () => {
    models = createFakeModels([
      {
        userId: senderId,
        guildId,
        balance: 100,
        lockedBalance: 0,
        banned: false
      },
      {
        userId: receiverId,
        guildId,
        balance: 0,
        lockedBalance: 0,
        banned: false
      }
    ])
    service = createPeerTransferService({
      userModel: models.userModel as never,
      transactionModel: models.transactionModel as never
    })

    await expect(service.transfer(baseInput)).rejects.toThrow(
      'INSUFFICIENT_FUNDS'
    )

    models = createFakeModels([
      {
        userId: senderId,
        guildId,
        balance: 5000,
        lockedBalance: 4500,
        banned: false
      },
      {
        userId: receiverId,
        guildId,
        balance: 0,
        lockedBalance: 0,
        banned: false
      }
    ])
    service = createPeerTransferService({
      userModel: models.userModel as never,
      transactionModel: models.transactionModel as never
    })

    await expect(service.transfer(baseInput)).rejects.toThrow(
      'INSUFFICIENT_WITHDRAWABLE'
    )
  })

  it('rejects banned sender or receiver', async () => {
    models = createFakeModels([
      {
        userId: senderId,
        guildId,
        balance: 5000,
        lockedBalance: 0,
        banned: true
      },
      {
        userId: receiverId,
        guildId,
        balance: 0,
        lockedBalance: 0,
        banned: false
      }
    ])
    service = createPeerTransferService({
      userModel: models.userModel as never,
      transactionModel: models.transactionModel as never
    })

    await expect(service.transfer(baseInput)).rejects.toThrow(USER_BANNED_ERROR)

    models = createFakeModels([
      {
        userId: senderId,
        guildId,
        balance: 5000,
        lockedBalance: 0,
        banned: false
      },
      {
        userId: receiverId,
        guildId,
        balance: 0,
        lockedBalance: 0,
        banned: true
      }
    ])
    service = createPeerTransferService({
      userModel: models.userModel as never,
      transactionModel: models.transactionModel as never
    })

    await expect(service.transfer(baseInput)).rejects.toThrow(USER_BANNED_ERROR)
  })

  it('enforces daily cap', async () => {
    models.setDailyVolume(900)
    await expect(
      service.transfer({
        ...baseInput,
        amount: 200,
        paySettings: { ...defaultPaySettings, maxDailyAmount: 1000 }
      })
    ).rejects.toThrow('DAILY_CAP_EXCEEDED')
  })

  it('allows transfer under daily cap with empty prior volume', async () => {
    const result = await service.transfer({
      ...baseInput,
      paySettings: { ...defaultPaySettings, maxDailyAmount: 5000 }
    })
    expect(result.gross).toBe(1000)
  })

  it('allows 0% and 100% fee', async () => {
    const zeroFee = await service.transfer({
      ...baseInput,
      paySettings: {
        feePercent: 0,
        minAmount: 0,
        maxAmount: 0,
        maxDailyAmount: 0
      }
    })
    expect(zeroFee.fee).toBe(0)
    expect(zeroFee.net).toBe(1000)

    models = createFakeModels([
      {
        userId: senderId,
        guildId,
        balance: 5000,
        lockedBalance: 0,
        banned: false
      },
      {
        userId: receiverId,
        guildId,
        balance: 100,
        lockedBalance: 0,
        banned: false
      }
    ])
    service = createPeerTransferService({
      userModel: models.userModel as never,
      transactionModel: models.transactionModel as never
    })

    const fullFee = await service.transfer({
      ...baseInput,
      paySettings: { ...defaultPaySettings, feePercent: 1 }
    })
    expect(fullFee.fee).toBe(1000)
    expect(fullFee.net).toBe(0)
    expect(fullFee.receiverBalance).toBe(100)
  })

  it('rejects missing sender or receiver', async () => {
    models = createFakeModels([
      {
        userId: receiverId,
        guildId,
        balance: 100,
        lockedBalance: 0,
        banned: false
      }
    ])
    service = createPeerTransferService({
      userModel: models.userModel as never,
      transactionModel: models.transactionModel as never
    })
    await expect(service.transfer(baseInput)).rejects.toThrow(
      'SENDER_NOT_FOUND'
    )

    models = createFakeModels([
      {
        userId: senderId,
        guildId,
        balance: 5000,
        lockedBalance: 0,
        banned: false
      }
    ])
    service = createPeerTransferService({
      userModel: models.userModel as never,
      transactionModel: models.transactionModel as never
    })
    await expect(service.transfer(baseInput)).rejects.toThrow(
      'RECEIVER_NOT_FOUND'
    )
  })

  it('rejects when credit update finds no receiver', async () => {
    const updateOne = models.userModel.updateOne as ReturnType<typeof vi.fn>
    updateOne
      .mockResolvedValueOnce({ modifiedCount: 1 })
      .mockResolvedValueOnce({ modifiedCount: 0 })

    await expect(service.transfer(baseInput)).rejects.toThrow(
      'RECEIVER_NOT_FOUND'
    )
  })

  it('fails concurrent-safe debit when available balance races away', async () => {
    const debitSpy = vi.spyOn(models.userModel, 'updateOne')
    debitSpy.mockResolvedValueOnce({ modifiedCount: 0 } as never)

    await expect(service.transfer(baseInput)).rejects.toThrow(
      'INSUFFICIENT_WITHDRAWABLE'
    )
  })

  it('treats missing lockedBalance as zero', async () => {
    models = createFakeModels([
      {
        userId: senderId,
        guildId,
        balance: 5000,
        lockedBalance: undefined as unknown as number,
        banned: false
      },
      {
        userId: receiverId,
        guildId,
        balance: 100,
        lockedBalance: 0,
        banned: false
      }
    ])
    service = createPeerTransferService({
      userModel: models.userModel as never,
      transactionModel: models.transactionModel as never
    })

    const result = await service.transfer(baseInput)
    expect(result.senderBalance).toBe(4000)
  })

  it('falls back to computed balances when reload misses', async () => {
    const findOne = models.userModel.findOne as ReturnType<typeof vi.fn>
    findOne
      .mockImplementationOnce(
        ({ userId, guildId: g }: { userId: string; guildId: string }) => {
          const doc = models.store.get(`${g}:${userId}`) ?? null
          return { session: () => Promise.resolve(doc ? { ...doc } : null) }
        }
      )
      .mockImplementationOnce(
        ({ userId, guildId: g }: { userId: string; guildId: string }) => {
          const doc = models.store.get(`${g}:${userId}`) ?? null
          return { session: () => Promise.resolve(doc ? { ...doc } : null) }
        }
      )
      .mockImplementation(() => ({
        session: () => Promise.resolve(null)
      }))

    const result = await service.transfer(baseInput)
    expect(result.senderBalance).toBe(4000)
    expect(result.receiverBalance).toBe(1080)
  })
})
