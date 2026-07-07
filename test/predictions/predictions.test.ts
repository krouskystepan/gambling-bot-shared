import {
  calculatePredictionPayoutSummary,
  createPredictionFormSchema,
  createPredictionLifecycleService,
  getPredictionCheckSummary,
  normalizePredictionAutolock,
  normalizePredictionChoices,
  parsePredictionAutolock,
  parsePredictionChoices,
  resolvePredictionBetId,
  validatePredictionChoiceBet
} from 'gambling-bot-shared/predictions'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { samplePrediction } from '../helpers/fixtures'

describe('validatePredictionChoiceBet', () => {
  it('validates per-choice limits', () => {
    expect(
      validatePredictionChoiceBet({
        userChoiceTotal: 100,
        parsedBetAmount: 50,
        maxBet: 500,
        minBet: 10
      })
    ).toEqual({ ok: true })

    expect(
      validatePredictionChoiceBet({
        userChoiceTotal: 0,
        parsedBetAmount: 5,
        maxBet: 500,
        minBet: 10
      })
    ).toEqual({ ok: false, error: 'BELOW_MIN_BET' })

    expect(
      validatePredictionChoiceBet({
        userChoiceTotal: 450,
        parsedBetAmount: 100,
        maxBet: 500,
        minBet: 0
      })
    ).toEqual({ ok: false, error: 'ABOVE_MAX_PER_CHOICE' })
  })
})

describe('parsePredictionChoices', () => {
  it('parses comma-separated choices', () => {
    const result = parsePredictionChoices('Team A:2, Team B:3')
    expect(result).toEqual({
      ok: true,
      choices: [
        { choiceName: 'Team A', odds: 2, bets: [] },
        { choiceName: 'Team B', odds: 3, bets: [] }
      ]
    })
  })

  it('rejects invalid count and format', () => {
    expect(parsePredictionChoices('Only:2')).toEqual({
      ok: false,
      error: 'INVALID_COUNT'
    })
    expect(parsePredictionChoices('A:2, bad')).toEqual({
      ok: false,
      error: 'INVALID_FORMAT',
      detail: 'bad'
    })
  })
})

describe('normalizePredictionChoices', () => {
  it('delegates string input to parsePredictionChoices', () => {
    const result = normalizePredictionChoices('A:2, B:3')
    expect(result.ok).toBe(true)
  })

  it('accepts admin-style array input', () => {
    const result = normalizePredictionChoices([
      { choiceName: 'A', odds: 2 },
      { choiceName: 'B', odds: 3 }
    ])
    expect(result.ok).toBe(true)
  })

  it('rejects invalid array choices', () => {
    expect(normalizePredictionChoices([{ choiceName: 'A', odds: 2 }])).toEqual({
      ok: false,
      error: 'INVALID_COUNT'
    })
    expect(
      normalizePredictionChoices([
        { choiceName: '', odds: 2 },
        { choiceName: 'B', odds: 3 }
      ])
    ).toEqual({ ok: false, error: 'INVALID_FORMAT', detail: '' })
    expect(
      normalizePredictionChoices([
        { choiceName: 'A', odds: -1 },
        { choiceName: 'B', odds: 3 }
      ])
    ).toEqual({ ok: false, error: 'INVALID_FORMAT', detail: 'A' })
  })
})

describe('parsePredictionAutolock', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('parses future discord-format dates', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'))

    const result = parsePredictionAutolock('15.06.2030 14:30')
    expect(result.ok).toBe(true)
  })

  it('rejects invalid, past, and malformed input', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-01T12:00:00Z'))

    expect(parsePredictionAutolock('not-a-date')).toEqual({
      ok: false,
      error: 'INVALID_FORMAT'
    })
    expect(parsePredictionAutolock('31.02.2026 12:00')).toEqual({
      ok: false,
      error: 'INVALID_DATE'
    })
    expect(parsePredictionAutolock('01.01.2020 12:00')).toEqual({
      ok: false,
      error: 'PAST_DATE'
    })
  })
})

describe('normalizePredictionAutolock', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('parses ISO input for admin', () => {
    const result = normalizePredictionAutolock(
      '2030-01-01T12:00:00.000Z',
      'iso'
    )
    expect(result.ok).toBe(true)
  })

  it('delegates discord format to parsePredictionAutolock', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'))

    const result = normalizePredictionAutolock('15.06.2030 14:30', 'discord')
    expect(result.ok).toBe(true)
  })

  it('rejects empty, invalid, and past ISO dates', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-01T12:00:00Z'))

    expect(normalizePredictionAutolock('  ', 'iso')).toEqual({
      ok: false,
      error: 'INVALID_FORMAT'
    })
    expect(normalizePredictionAutolock('not-iso', 'iso')).toEqual({
      ok: false,
      error: 'INVALID_DATE'
    })
    expect(
      normalizePredictionAutolock('2020-01-01T12:00:00.000Z', 'iso')
    ).toEqual({
      ok: false,
      error: 'PAST_DATE'
    })
  })
})

describe('predictionSummary', () => {
  it('resolves bet id fallback', () => {
    expect(
      resolvePredictionBetId(
        { userId: 'u1', amount: 10, betId: 'custom-bet' },
        'pred-1'
      )
    ).toBe('custom-bet')
    expect(
      resolvePredictionBetId(
        { userId: 'u1', amount: 10, betId: undefined as unknown as string },
        'pred-1'
      )
    ).toBe('pred-1:u1')
    expect(
      resolvePredictionBetId({ userId: 'u1', amount: 10, betId: '' }, 'pred-1')
    ).toBe('')
  })

  it('summarizes check and payout views', () => {
    const prediction = samplePrediction()
    const check = getPredictionCheckSummary(prediction)
    expect(check.bettorCount).toBe(2)
    expect(check.totalBetAmount).toBe(150)

    const payout = calculatePredictionPayoutSummary(prediction, 'Yes')
    expect(payout?.totalWon).toBe(200)
    expect(payout?.totalLost).toBe(50)
    expect(calculatePredictionPayoutSummary(prediction, 'Missing')).toBeNull()
  })
})

describe('createPredictionLifecycleService', () => {
  it('returns NOT_FOUND when prediction is missing', async () => {
    const lifecycle = createPredictionLifecycleService({
      predictionDb: {
        getPredictionById: vi.fn().mockResolvedValue(null),
        updatePredictionStatus: vi.fn()
      } as never,
      casinoBet: {
        refundLockedBet: vi.fn(),
        settleCasinoWinnings: vi.fn()
      }
    })

    const result = await lifecycle.payoutPrediction({
      predictionId: 'pred-1',
      guildId: 'guild-1',
      winnerChoice: 'Yes'
    })

    expect(result).toEqual({ ok: false, code: 'NOT_FOUND' })
  })

  it('rejects invalid status and winner', async () => {
    const lifecycle = createPredictionLifecycleService({
      predictionDb: {
        getPredictionById: vi
          .fn()
          .mockResolvedValueOnce(samplePrediction({ status: 'active' }))
          .mockResolvedValueOnce(samplePrediction({ status: 'paid' }))
          .mockResolvedValueOnce(samplePrediction({ status: 'ended' })),
        updatePredictionStatus: vi.fn()
      } as never,
      casinoBet: {
        refundLockedBet: vi.fn(),
        settleCasinoWinnings: vi.fn()
      }
    })

    expect(
      await lifecycle.payoutPrediction({
        predictionId: 'pred-1',
        guildId: 'guild-1',
        winnerChoice: 'Yes'
      })
    ).toEqual({ ok: false, code: 'INVALID_STATUS' })

    expect(
      await lifecycle.payoutPrediction({
        predictionId: 'pred-1',
        guildId: 'guild-1',
        winnerChoice: 'Yes'
      })
    ).toEqual({ ok: false, code: 'ALREADY_HANDLED' })

    expect(
      await lifecycle.payoutPrediction({
        predictionId: 'pred-1',
        guildId: 'guild-1',
        winnerChoice: 'Missing'
      })
    ).toEqual({ ok: false, code: 'INVALID_WINNER' })
  })

  it('pays winners through casino bet service', async () => {
    const prediction = samplePrediction()
    const settleCasinoWinnings = vi.fn().mockResolvedValue(1000)
    const updatePredictionStatus = vi
      .fn()
      .mockResolvedValueOnce({ ...prediction, status: 'paying' })
      .mockResolvedValueOnce({ ...prediction, status: 'paid' })

    const lifecycle = createPredictionLifecycleService({
      predictionDb: {
        getPredictionById: vi.fn().mockResolvedValue(prediction),
        updatePredictionStatus
      } as never,
      casinoBet: {
        refundLockedBet: vi.fn(),
        settleCasinoWinnings
      }
    })

    const result = await lifecycle.payoutPrediction({
      predictionId: 'pred-1',
      guildId: 'guild-1',
      winnerChoice: 'Yes'
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.outcome).toBe('paid')
    }
    expect(settleCasinoWinnings).toHaveBeenCalled()
  })

  it('refunds all bets when winner has no bets', async () => {
    const prediction = samplePrediction({
      choices: [
        { choiceName: 'Yes', odds: 2, bets: [] },
        {
          choiceName: 'No',
          odds: 1.5,
          bets: [{ userId: 'user-2', amount: 50, betId: 'bet-2' }]
        }
      ]
    })
    const refundLockedBet = vi.fn().mockResolvedValue(undefined)
    const updatePredictionStatus = vi
      .fn()
      .mockResolvedValueOnce({ ...prediction, status: 'paying' })
      .mockResolvedValueOnce({ ...prediction, status: 'paid' })

    const lifecycle = createPredictionLifecycleService({
      predictionDb: {
        getPredictionById: vi.fn().mockResolvedValue(prediction),
        updatePredictionStatus
      } as never,
      casinoBet: {
        refundLockedBet,
        settleCasinoWinnings: vi.fn()
      }
    })

    const result = await lifecycle.payoutPrediction({
      predictionId: 'pred-1',
      guildId: 'guild-1',
      winnerChoice: 'Yes'
    })

    expect(result).toMatchObject({ ok: true, outcome: 'refunded' })
    expect(refundLockedBet).toHaveBeenCalled()
  })

  it('rolls back paying status on settlement failure', async () => {
    const prediction = samplePrediction()
    const updatePredictionStatus = vi
      .fn()
      .mockResolvedValueOnce({ ...prediction, status: 'paying' })
      .mockResolvedValueOnce(null)

    const lifecycle = createPredictionLifecycleService({
      predictionDb: {
        getPredictionById: vi.fn().mockResolvedValue(prediction),
        updatePredictionStatus
      } as never,
      casinoBet: {
        refundLockedBet: vi.fn(),
        settleCasinoWinnings: vi.fn().mockRejectedValue(new Error('fail'))
      }
    })

    await expect(
      lifecycle.payoutPrediction({
        predictionId: 'pred-1',
        guildId: 'guild-1',
        winnerChoice: 'Yes'
      })
    ).rejects.toThrow('fail')

    expect(updatePredictionStatus).toHaveBeenCalledWith(
      expect.objectContaining({ fromStatus: 'paying', toStatus: 'ended' })
    )
  })

  it('throws when finalize paid update fails', async () => {
    const prediction = samplePrediction()
    const updatePredictionStatus = vi
      .fn()
      .mockResolvedValueOnce({ ...prediction, status: 'paying' })
      .mockResolvedValueOnce(null)

    const lifecycle = createPredictionLifecycleService({
      predictionDb: {
        getPredictionById: vi.fn().mockResolvedValue(prediction),
        updatePredictionStatus
      } as never,
      casinoBet: {
        refundLockedBet: vi.fn(),
        settleCasinoWinnings: vi.fn().mockResolvedValue(undefined)
      }
    })

    await expect(
      lifecycle.payoutPrediction({
        predictionId: 'pred-1',
        guildId: 'guild-1',
        winnerChoice: 'Yes'
      })
    ).rejects.toThrow('FINALIZE_FAILED')
  })

  it('returns ALREADY_HANDLED when lock fails', async () => {
    const prediction = samplePrediction()
    const lifecycle = createPredictionLifecycleService({
      predictionDb: {
        getPredictionById: vi.fn().mockResolvedValue(prediction),
        updatePredictionStatus: vi.fn().mockResolvedValue(null)
      } as never,
      casinoBet: {
        refundLockedBet: vi.fn(),
        settleCasinoWinnings: vi.fn()
      }
    })

    const result = await lifecycle.payoutPrediction({
      predictionId: 'pred-1',
      guildId: 'guild-1',
      winnerChoice: 'Yes'
    })

    expect(result).toEqual({ ok: false, code: 'ALREADY_HANDLED' })
  })

  it('ends and cancels predictions', async () => {
    const prediction = samplePrediction({ status: 'active' })
    const refundLockedBet = vi.fn().mockResolvedValue(undefined)
    const updatePredictionStatus = vi
      .fn()
      .mockResolvedValueOnce(prediction)
      .mockResolvedValueOnce({ ...prediction, status: 'canceled' })

    const lifecycle = createPredictionLifecycleService({
      predictionDb: {
        getPredictionById: vi.fn(),
        updatePredictionStatus
      } as never,
      casinoBet: {
        refundLockedBet,
        settleCasinoWinnings: vi.fn()
      }
    })

    await expect(
      lifecycle.endPrediction({ predictionId: 'pred-1', guildId: 'guild-1' })
    ).resolves.toEqual(prediction)

    const canceled = await lifecycle.cancelPrediction({
      predictionId: 'pred-1',
      guildId: 'guild-1'
    })
    expect(canceled?.status).toBe('canceled')
    expect(refundLockedBet).toHaveBeenCalled()
  })

  it('returns null when cancel update fails', async () => {
    const lifecycle = createPredictionLifecycleService({
      predictionDb: {
        getPredictionById: vi.fn(),
        updatePredictionStatus: vi.fn().mockResolvedValue(null)
      } as never,
      casinoBet: {
        refundLockedBet: vi.fn(),
        settleCasinoWinnings: vi.fn()
      }
    })

    expect(
      await lifecycle.cancelPrediction({
        predictionId: 'pred-1',
        guildId: 'guild-1'
      })
    ).toBeNull()
  })
})

describe('resetStuckPayout', () => {
  it('returns NOT_FOUND when prediction is missing', async () => {
    const lifecycle = createPredictionLifecycleService({
      predictionDb: {
        getPredictionById: vi.fn().mockResolvedValue(null),
        updatePredictionStatus: vi.fn()
      } as never,
      casinoBet: {
        refundLockedBet: vi.fn(),
        settleCasinoWinnings: vi.fn()
      }
    })

    expect(
      await lifecycle.resetStuckPayout({
        predictionId: 'pred-1',
        guildId: 'guild-1'
      })
    ).toEqual({ ok: false, code: 'NOT_FOUND' })
  })

  it('returns INVALID_STATUS when prediction is not paying', async () => {
    const lifecycle = createPredictionLifecycleService({
      predictionDb: {
        getPredictionById: vi
          .fn()
          .mockResolvedValue(samplePrediction({ status: 'ended' })),
        updatePredictionStatus: vi.fn()
      } as never,
      casinoBet: {
        refundLockedBet: vi.fn(),
        settleCasinoWinnings: vi.fn()
      }
    })

    expect(
      await lifecycle.resetStuckPayout({
        predictionId: 'pred-1',
        guildId: 'guild-1'
      })
    ).toEqual({ ok: false, code: 'INVALID_STATUS' })
  })

  it('returns PARTIAL_PAYOUT when settlement transactions exist', async () => {
    const lifecycle = createPredictionLifecycleService({
      predictionDb: {
        getPredictionById: vi
          .fn()
          .mockResolvedValue(samplePrediction({ status: 'paying' })),
        updatePredictionStatus: vi.fn()
      } as never,
      casinoBet: {
        refundLockedBet: vi.fn(),
        settleCasinoWinnings: vi.fn()
      },
      hasSettlementTransactions: vi.fn().mockResolvedValue(true)
    })

    expect(
      await lifecycle.resetStuckPayout({
        predictionId: 'pred-1',
        guildId: 'guild-1'
      })
    ).toEqual({ ok: false, code: 'PARTIAL_PAYOUT' })
  })

  it('rolls back paying to ended when no settlement transactions exist', async () => {
    const prediction = samplePrediction({ status: 'paying' })
    const updated = { ...prediction, status: 'ended' as const }
    const updatePredictionStatus = vi.fn().mockResolvedValue(updated)

    const lifecycle = createPredictionLifecycleService({
      predictionDb: {
        getPredictionById: vi.fn().mockResolvedValue(prediction),
        updatePredictionStatus
      } as never,
      casinoBet: {
        refundLockedBet: vi.fn(),
        settleCasinoWinnings: vi.fn()
      },
      hasSettlementTransactions: vi.fn().mockResolvedValue(false)
    })

    const result = await lifecycle.resetStuckPayout({
      predictionId: 'pred-1',
      guildId: 'guild-1'
    })

    expect(result).toEqual({ ok: true, prediction: updated })
    expect(updatePredictionStatus).toHaveBeenCalledWith({
      predictionId: 'pred-1',
      guildId: 'guild-1',
      fromStatus: 'paying',
      toStatus: 'ended'
    })
  })

  it('rolls back without settlement check when there are no bets', async () => {
    const prediction = samplePrediction({
      status: 'paying',
      choices: [
        { choiceName: 'Yes', odds: 2, bets: [] },
        { choiceName: 'No', odds: 1.5, bets: [] }
      ]
    })
    const updated = { ...prediction, status: 'ended' as const }
    const hasSettlementTransactions = vi.fn()

    const lifecycle = createPredictionLifecycleService({
      predictionDb: {
        getPredictionById: vi.fn().mockResolvedValue(prediction),
        updatePredictionStatus: vi.fn().mockResolvedValue(updated)
      } as never,
      casinoBet: {
        refundLockedBet: vi.fn(),
        settleCasinoWinnings: vi.fn()
      },
      hasSettlementTransactions
    })

    const result = await lifecycle.resetStuckPayout({
      predictionId: 'pred-1',
      guildId: 'guild-1'
    })

    expect(result).toEqual({ ok: true, prediction: updated })
    expect(hasSettlementTransactions).not.toHaveBeenCalled()
  })

  it('rolls back when bets exist but no settlement checker is provided', async () => {
    const prediction = samplePrediction({ status: 'paying' })
    const updated = { ...prediction, status: 'ended' as const }

    const lifecycle = createPredictionLifecycleService({
      predictionDb: {
        getPredictionById: vi.fn().mockResolvedValue(prediction),
        updatePredictionStatus: vi.fn().mockResolvedValue(updated)
      } as never,
      casinoBet: {
        refundLockedBet: vi.fn(),
        settleCasinoWinnings: vi.fn()
      }
    })

    expect(
      await lifecycle.resetStuckPayout({
        predictionId: 'pred-1',
        guildId: 'guild-1'
      })
    ).toEqual({ ok: true, prediction: updated })
  })

  it('returns INVALID_STATUS when the rollback update fails', async () => {
    const lifecycle = createPredictionLifecycleService({
      predictionDb: {
        getPredictionById: vi
          .fn()
          .mockResolvedValue(samplePrediction({ status: 'paying' })),
        updatePredictionStatus: vi.fn().mockResolvedValue(null)
      } as never,
      casinoBet: {
        refundLockedBet: vi.fn(),
        settleCasinoWinnings: vi.fn()
      },
      hasSettlementTransactions: vi.fn().mockResolvedValue(false)
    })

    expect(
      await lifecycle.resetStuckPayout({
        predictionId: 'pred-1',
        guildId: 'guild-1'
      })
    ).toEqual({ ok: false, code: 'INVALID_STATUS' })
  })
})

describe('createPredictionFormSchema', () => {
  it('accepts valid prediction form', () => {
    const result = createPredictionFormSchema.safeParse({
      title: 'Match winner',
      choices: [
        { choiceName: 'A', odds: 2 },
        { choiceName: 'B', odds: 3 }
      ]
    })
    expect(result.success).toBe(true)
  })
})
