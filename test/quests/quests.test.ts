import {
  DEFAULT_QUEST_TEMPLATES,
  type TQuest,
  aggregateQuestActivityFromTransactions,
  computeQuestProgressValue,
  createQuestFormSchema,
  emptyQuestActivityStats,
  evaluateAndGrantQuests,
  formatQuestConditionSummary,
  getAllowedConditionTypesForKind,
  getPreviousQuestDateKey,
  getQuestDailyStreakAfterCompletion,
  getQuestDateKey,
  isQuestConditionAllowedForKind,
  isQuestThresholdMet,
  loadQuestActivityStats,
  resolveQuestThreshold
} from 'gambling-bot-shared/quests'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const baseQuest = (overrides: Partial<TQuest> = {}): TQuest => ({
  questId: 'q1',
  guildId: 'g1',
  name: 'Test Quest',
  description: 'desc',
  kind: 'daily',
  condition: { type: 'casino_wins', threshold: 2 },
  rewardAmount: 100,
  enabled: true,
  sortOrder: 0,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides
})

describe('questDateKey', () => {
  it('formats guild calendar date in UTC', () => {
    expect(getQuestDateKey(new Date('2026-06-15T12:00:00.000Z'), 'UTC')).toBe(
      '2026-06-15'
    )
  })

  it('shifts date for non-UTC timezone', () => {
    // 2026-06-15 01:00 UTC = still June 14 evening in US/Pacific
    expect(
      getQuestDateKey(
        new Date('2026-06-15T01:00:00.000Z'),
        'America/Los_Angeles'
      )
    ).toBe('2026-06-14')
  })

  it('computes previous day', () => {
    expect(getPreviousQuestDateKey('2026-06-15', 'UTC')).toBe('2026-06-14')
    expect(getPreviousQuestDateKey('bad-date', 'UTC')).toBe('bad-date')
  })

  it('falls back for invalid Date', () => {
    const key = getQuestDateKey(new Date(Number.NaN), 'UTC')
    expect(typeof key).toBe('string')
    expect(key.length).toBeGreaterThan(0)
  })
})

describe('questDailyStreak', () => {
  it('starts at 1 with no prior completion', () => {
    expect(getQuestDailyStreakAfterCompletion(null, '2026-06-15', 0)).toBe(1)
  })

  it('keeps streak when already completed today', () => {
    expect(
      getQuestDailyStreakAfterCompletion('2026-06-15', '2026-06-15', 4)
    ).toBe(4)
  })

  it('increments on consecutive day', () => {
    expect(
      getQuestDailyStreakAfterCompletion('2026-06-14', '2026-06-15', 4, 'UTC')
    ).toBe(5)
  })

  it('resets after a gap', () => {
    expect(
      getQuestDailyStreakAfterCompletion('2026-06-10', '2026-06-15', 4, 'UTC')
    ).toBe(1)
  })
})

describe('quest conditions', () => {
  it('filters allowed types by kind', () => {
    expect(isQuestConditionAllowedForKind('bonus_streak', 'normal')).toBe(true)
    expect(isQuestConditionAllowedForKind('bonus_streak', 'daily')).toBe(false)
    expect(isQuestConditionAllowedForKind('vip_purchase', 'daily')).toBe(false)
    expect(getAllowedConditionTypesForKind('daily')).toContain('casino_wins')
    expect(getAllowedConditionTypesForKind('daily')).not.toContain(
      'vip_purchase'
    )
  })

  it('computes progress values', () => {
    const stats = {
      casinoWins: 3,
      casinoBets: 5,
      casinoWinnings: 1200,
      netProfit: 200,
      bonusClaims: 1,
      vipPurchases: 2
    }
    const user = { dailyStreak: 7 }

    expect(
      computeQuestProgressValue(
        { type: 'casino_wins', threshold: 1 },
        stats,
        user
      )
    ).toBe(3)
    expect(
      computeQuestProgressValue(
        { type: 'casino_bets', threshold: 1 },
        stats,
        user
      )
    ).toBe(5)
    expect(
      computeQuestProgressValue(
        { type: 'casino_winnings', threshold: 1 },
        stats,
        user
      )
    ).toBe(1200)
    expect(
      computeQuestProgressValue(
        { type: 'net_profit', threshold: 1 },
        stats,
        user
      )
    ).toBe(200)
    expect(
      computeQuestProgressValue(
        { type: 'bonus_claims', threshold: 1 },
        stats,
        user
      )
    ).toBe(1)
    expect(
      computeQuestProgressValue(
        { type: 'bonus_streak', threshold: 1 },
        stats,
        user
      )
    ).toBe(7)
    expect(
      computeQuestProgressValue(
        { type: 'vip_purchase', threshold: 1 },
        stats,
        user
      )
    ).toBe(2)
    expect(isQuestThresholdMet(2, 2)).toBe(true)
    expect(isQuestThresholdMet(1, 2)).toBe(false)
    expect(resolveQuestThreshold({ type: 'vip_purchase', threshold: 1 })).toBe(
      1
    )
    expect(
      resolveQuestThreshold({
        type: 'vip_purchase',
        threshold: null as unknown as number
      })
    ).toBe(1)
    expect(
      resolveQuestThreshold({
        type: 'casino_wins',
        threshold: null as unknown as number
      })
    ).toBe(0)
    expect(
      computeQuestProgressValue(
        { type: 'not_a_type' as never, threshold: 1 },
        stats,
        user
      )
    ).toBe(0)
  })

  it('formats condition summaries', () => {
    expect(
      formatQuestConditionSummary({
        type: 'casino_wins',
        threshold: 1,
        game: 'blackjack'
      })
    ).toContain('blackjack')
    expect(
      formatQuestConditionSummary({ type: 'casino_wins', threshold: 2 })
    ).toContain('games')
    expect(
      formatQuestConditionSummary({ type: 'casino_bets', threshold: 1 })
    ).toBe('Place 1 casino bet')
    expect(
      formatQuestConditionSummary({ type: 'casino_bets', threshold: 5 })
    ).toContain('5')
    expect(
      formatQuestConditionSummary({ type: 'casino_winnings', threshold: 100 })
    ).toContain('100')
    expect(
      formatQuestConditionSummary({ type: 'net_profit', threshold: 50 })
    ).toContain('net profit')
    expect(
      formatQuestConditionSummary({ type: 'bonus_claims', threshold: 1 })
    ).toContain('bonus')
    expect(
      formatQuestConditionSummary({ type: 'bonus_claims', threshold: 2 })
    ).toContain('times')
    expect(
      formatQuestConditionSummary({ type: 'bonus_streak', threshold: 7 })
    ).toContain('7')
    expect(
      formatQuestConditionSummary({ type: 'vip_purchase', threshold: 1 })
    ).toContain('VIP')
    expect(
      formatQuestConditionSummary({ type: 'vip_purchase', threshold: 2 })
    ).toContain('times')
    expect(
      formatQuestConditionSummary({ type: 'not_a_type' as never, threshold: 1 })
    ).toBe('Unknown condition')
  })
})

describe('aggregateQuestActivityFromTransactions', () => {
  it('aggregates wins, bets, bonus claims, and vip', () => {
    const stats = aggregateQuestActivityFromTransactions([
      {
        type: 'win',
        amount: 100,
        referenceId: 'd1',
        meta: { game: 'dice' }
      },
      {
        type: 'bet',
        amount: 40,
        referenceId: 'd1',
        meta: { game: 'dice' }
      },
      {
        type: 'win',
        amount: 50,
        referenceId: 'bj1',
        meta: { game: 'blackjack' }
      },
      {
        type: 'bet',
        amount: 25,
        referenceId: 'bj1',
        meta: { game: 'blackjack' }
      },
      { type: 'bonus', amount: 10, meta: { bonusStreak: 2 } },
      { type: 'bonus', amount: 10, meta: { questId: 'q1' } },
      { type: 'vip', amount: 500, meta: { action: 'buy-finalize' } },
      { type: 'vip', amount: 100, meta: { action: 'extend' } },
      { type: 'deposit', amount: 1000 }
    ])

    expect(stats.casinoWins).toBe(2)
    expect(stats.casinoBets).toBe(2)
    expect(stats.casinoWinnings).toBe(150)
    expect(stats.netProfit).toBe(85)
    expect(stats.bonusClaims).toBe(1)
    expect(stats.vipPurchases).toBe(1)
  })

  it('does not count stake-return pushes as casino wins', () => {
    const stats = aggregateQuestActivityFromTransactions([
      {
        type: 'bet',
        amount: 100,
        referenceId: 'push1',
        meta: { game: 'blackjack' }
      },
      {
        type: 'win',
        amount: 100,
        referenceId: 'push1',
        meta: { game: 'blackjack' }
      },
      {
        type: 'bet',
        amount: 50,
        referenceId: 'win1',
        meta: { game: 'blackjack' }
      },
      {
        type: 'win',
        amount: 100,
        referenceId: 'win1',
        meta: { game: 'blackjack' }
      },
      {
        type: 'bet',
        amount: 20,
        referenceId: 'tie1',
        meta: { game: 'baccarat' }
      },
      {
        type: 'win',
        amount: 20,
        referenceId: 'tie1',
        meta: { game: 'baccarat' }
      }
    ])

    expect(stats.casinoWins).toBe(1)
    expect(stats.casinoBets).toBe(3)
    expect(stats.casinoWinnings).toBe(220)
    expect(stats.netProfit).toBe(50)
  })

  it('filters by game', () => {
    const stats = aggregateQuestActivityFromTransactions(
      [
        {
          type: 'win',
          amount: 100,
          referenceId: 'd1',
          meta: { game: 'dice' }
        },
        {
          type: 'bet',
          amount: 40,
          referenceId: 'd1',
          meta: { game: 'dice' }
        },
        {
          type: 'win',
          amount: 50,
          referenceId: 'bj1',
          meta: { game: 'blackjack' }
        },
        {
          type: 'bet',
          amount: 20,
          referenceId: 'bj1',
          meta: { game: 'blackjack' }
        }
      ],
      'blackjack'
    )
    expect(stats.casinoWins).toBe(1)
    expect(stats.casinoBets).toBe(1)
    expect(stats.netProfit).toBe(30)
  })

  it('counts meta.rounds as separate bets for multi-play batches', () => {
    const stats = aggregateQuestActivityFromTransactions([
      {
        type: 'bet',
        amount: 300,
        referenceId: 'slots1',
        meta: { game: 'slots', rounds: 3 }
      },
      {
        type: 'bet',
        amount: 50,
        referenceId: 'dice1',
        meta: { game: 'dice', rounds: 5 }
      },
      {
        type: 'bet',
        amount: 10,
        referenceId: 'bj1',
        meta: { game: 'blackjack', rounds: 0 }
      },
      {
        type: 'bet',
        amount: 10,
        referenceId: 'bj2',
        meta: { game: 'blackjack' }
      }
    ])

    expect(stats.casinoBets).toBe(10)
    expect(stats.netProfit).toBe(-370)
  })

  it('returns empty stats helper', () => {
    expect(emptyQuestActivityStats().casinoWins).toBe(0)
  })

  it('treats bonus without meta and vip without buy action carefully', () => {
    const stats = aggregateQuestActivityFromTransactions([
      { type: 'bonus', amount: 10 },
      { type: 'bonus', amount: 10, meta: {} },
      { type: 'vip', amount: 100, meta: {} }
    ])
    expect(stats.bonusClaims).toBe(0)
    expect(stats.vipPurchases).toBe(1)
  })
})

describe('loadQuestActivityStats', () => {
  it('loads with date scope and session', async () => {
    const lean = vi
      .fn()
      .mockResolvedValue([{ type: 'win', amount: 10, meta: { game: 'dice' } }])
    const query = { lean, session: vi.fn() }
    query.session.mockReturnValue(query)
    const select = vi.fn().mockReturnValue(query)
    const find = vi.fn().mockReturnValue({ select })

    const stats = await loadQuestActivityStats({
      transactionModel: { find } as never,
      userId: 'u1',
      guildId: 'g1',
      dateKey: '2026-06-15',
      timezone: 'UTC',
      session: { id: 's1' } as never
    })

    expect(stats.casinoWins).toBe(1)
    expect(query.session).toHaveBeenCalled()
  })

  it('loads lifetime without session', async () => {
    const lean = vi.fn().mockResolvedValue([])
    const select = vi.fn().mockReturnValue({ lean })
    const find = vi.fn().mockReturnValue({ select })

    const stats = await loadQuestActivityStats({
      transactionModel: { find } as never,
      userId: 'u1',
      guildId: 'g1',
      dateKey: null
    })

    expect(stats.casinoWins).toBe(0)
    expect(find.mock.calls[0]?.[0]).toEqual({ userId: 'u1', guildId: 'g1' })
  })

  it('applies activityAfter cutoff for lifetime and daily scopes', async () => {
    const lean = vi.fn().mockResolvedValue([])
    const select = vi.fn().mockReturnValue({ lean })
    const find = vi.fn().mockReturnValue({ select })
    const cutoff = new Date('2026-06-15T10:00:00.000Z')

    await loadQuestActivityStats({
      transactionModel: { find } as never,
      userId: 'u1',
      guildId: 'g1',
      dateKey: null,
      activityAfter: cutoff
    })

    expect(find.mock.calls[0]?.[0]).toEqual({
      userId: 'u1',
      guildId: 'g1',
      createdAt: { $gt: cutoff }
    })

    find.mockClear()

    await loadQuestActivityStats({
      transactionModel: { find } as never,
      userId: 'u1',
      guildId: 'g1',
      dateKey: '2026-06-15',
      timezone: 'UTC',
      activityAfter: cutoff
    })

    const dailyFilter = find.mock.calls[0]?.[0] as {
      createdAt: { $gt: Date; $lte: Date }
    }
    expect(dailyFilter.createdAt.$gt).toEqual(cutoff)
    expect(dailyFilter.createdAt.$lte).toBeInstanceOf(Date)
  })
})

describe('createQuestFormSchema', () => {
  it('accepts valid daily casino quest', () => {
    const result = createQuestFormSchema.safeParse({
      name: 'Win 3',
      description: '',
      kind: 'daily',
      condition: { type: 'casino_wins', threshold: 3, game: 'blackjack' },
      rewardAmount: 500,
      enabled: true,
      sortOrder: 0
    })
    expect(result.success).toBe(true)
  })

  it('rejects bonus_streak on daily', () => {
    const result = createQuestFormSchema.safeParse({
      name: 'Streak',
      kind: 'daily',
      condition: { type: 'bonus_streak', threshold: 7 },
      rewardAmount: 100,
      enabled: true,
      sortOrder: 0
    })
    expect(result.success).toBe(false)
  })

  it('rejects game filter on non-casino condition', () => {
    const result = createQuestFormSchema.safeParse({
      name: 'VIP',
      kind: 'normal',
      condition: { type: 'vip_purchase', threshold: 1, game: 'dice' },
      rewardAmount: 100,
      enabled: true,
      sortOrder: 0
    })
    expect(result.success).toBe(false)
  })
})

describe('DEFAULT_QUEST_TEMPLATES', () => {
  it('includes daily and normal examples', () => {
    expect(DEFAULT_QUEST_TEMPLATES.some((q) => q.kind === 'daily')).toBe(true)
    expect(DEFAULT_QUEST_TEMPLATES.some((q) => q.kind === 'normal')).toBe(true)
  })
})

describe('evaluateAndGrantQuests', () => {
  const questModel = {
    find: vi.fn()
  }
  const progressModel = {
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn()
  }
  const userModel = {
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn()
  }
  const transactionModel = {
    find: vi.fn(),
    create: vi.fn()
  }

  const models = {
    questModel: questModel as never,
    progressModel: progressModel as never,
    userModel: userModel as never,
    transactionModel: transactionModel as never
  }

  const chainLean = <T>(value: T) => ({
    sort: vi.fn().mockReturnThis(),
    session: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue(value)
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty when disabled', async () => {
    const result = await evaluateAndGrantQuests({
      guildId: 'g1',
      userId: 'u1',
      models,
      disableQuests: true
    })
    expect(result.completed).toEqual([])
    expect(questModel.find).not.toHaveBeenCalled()
  })

  it('returns empty when user missing', async () => {
    questModel.find.mockReturnValue(chainLean([baseQuest()]))
    userModel.findOne.mockReturnValue(chainLean(null))

    const result = await evaluateAndGrantQuests({
      guildId: 'g1',
      userId: 'u1',
      models,
      timezone: 'UTC',
      now: new Date('2026-06-15T12:00:00.000Z')
    })
    expect(result.completed).toEqual([])
  })

  it('returns streak when no quests', async () => {
    questModel.find.mockReturnValue(chainLean([]))
    userModel.findOne.mockReturnValue(
      chainLean({
        userId: 'u1',
        guildId: 'g1',
        dailyStreak: 0,
        lastQuestDailyCompleteDate: null
      })
    )

    const result = await evaluateAndGrantQuests({
      guildId: 'g1',
      userId: 'u1',
      models,
      timezone: 'UTC'
    })
    expect(result.questDailyStreak).toBe(0)
    expect(result.completed).toEqual([])
  })

  it('updates progress without granting when threshold not met', async () => {
    const quest = baseQuest({
      condition: { type: 'casino_wins', threshold: 3 }
    })
    questModel.find.mockReturnValue(chainLean([quest]))
    userModel.findOne.mockReturnValue(
      chainLean({
        userId: 'u1',
        guildId: 'g1',
        dailyStreak: 0,
        questDailyStreak: 0,
        lastQuestDailyCompleteDate: null
      })
    )
    progressModel.findOne.mockReturnValue(chainLean(null))
    progressModel.findOneAndUpdate.mockResolvedValue({})
    transactionModel.find.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lean: vi
        .fn()
        .mockResolvedValue([
          { type: 'win', amount: 10, meta: { game: 'dice' } }
        ]),
      session: vi.fn().mockReturnThis()
    })

    const result = await evaluateAndGrantQuests({
      guildId: 'g1',
      userId: 'u1',
      models,
      timezone: 'UTC',
      now: new Date('2026-06-15T12:00:00.000Z')
    })

    expect(result.completed).toEqual([])
    expect(progressModel.findOneAndUpdate).toHaveBeenCalled()
    expect(transactionModel.create).not.toHaveBeenCalled()
  })

  it('grants reward and updates daily streak on completion', async () => {
    const quest = baseQuest({
      condition: { type: 'casino_wins', threshold: 1 },
      rewardAmount: 100
    })
    questModel.find.mockReturnValue(chainLean([quest]))
    userModel.findOne.mockReturnValue(
      chainLean({
        userId: 'u1',
        guildId: 'g1',
        dailyStreak: 0,
        questDailyStreak: 2,
        lastQuestDailyCompleteDate: '2026-06-14'
      })
    )
    progressModel.findOne.mockReturnValue(chainLean(null))
    progressModel.findOneAndUpdate
      .mockResolvedValueOnce({}) // progress upsert
      .mockResolvedValueOnce({
        questId: 'q1',
        rewardedAt: new Date('2026-06-15T12:00:00.000Z')
      }) // claim
    userModel.findOneAndUpdate
      .mockResolvedValueOnce({}) // bonus grant
      .mockResolvedValueOnce({ questDailyStreak: 3 }) // streak update
    transactionModel.find.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lean: vi
        .fn()
        .mockResolvedValue([
          { type: 'win', amount: 50, meta: { game: 'dice' } }
        ]),
      session: vi.fn().mockReturnThis()
    })
    transactionModel.create.mockResolvedValue([])

    const result = await evaluateAndGrantQuests({
      guildId: 'g1',
      userId: 'u1',
      models,
      timezone: 'UTC',
      now: new Date('2026-06-15T12:00:00.000Z')
    })

    expect(result.completed).toHaveLength(1)
    expect(result.completed[0]?.rewardAmount).toBe(100)
    expect(result.questDailyStreak).toBe(3)
    expect(transactionModel.create).toHaveBeenCalledTimes(1)
  })

  it('skips already rewarded quests (idempotent)', async () => {
    const quest = baseQuest()
    questModel.find.mockReturnValue(chainLean([quest]))
    userModel.findOne.mockReturnValue(
      chainLean({
        userId: 'u1',
        guildId: 'g1',
        dailyStreak: 0,
        questDailyStreak: 1,
        lastQuestDailyCompleteDate: '2026-06-15'
      })
    )
    progressModel.findOne.mockReturnValue(
      chainLean({
        rewardedAt: new Date('2026-06-15T08:00:00.000Z'),
        progress: 2
      })
    )

    const result = await evaluateAndGrantQuests({
      guildId: 'g1',
      userId: 'u1',
      models,
      timezone: 'UTC',
      now: new Date('2026-06-15T12:00:00.000Z')
    })

    expect(result.completed).toEqual([])
    expect(transactionModel.find).not.toHaveBeenCalled()
  })

  it('grants normal bonus_streak quest from user streak', async () => {
    const quest = baseQuest({
      kind: 'normal',
      condition: { type: 'bonus_streak', threshold: 7 },
      rewardAmount: 2000
    })
    questModel.find.mockReturnValue(chainLean([quest]))
    userModel.findOne.mockReturnValue(
      chainLean({
        userId: 'u1',
        guildId: 'g1',
        dailyStreak: 7,
        questDailyStreak: 0,
        lastQuestDailyCompleteDate: null
      })
    )
    progressModel.findOne.mockReturnValue(chainLean(null))
    progressModel.findOneAndUpdate
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ questId: 'q1', rewardedAt: new Date() })
    userModel.findOneAndUpdate.mockResolvedValue({})
    transactionModel.create.mockResolvedValue([])

    const result = await evaluateAndGrantQuests({
      guildId: 'g1',
      userId: 'u1',
      models,
      timezone: 'UTC',
      now: new Date('2026-06-15T12:00:00.000Z')
    })

    expect(result.completed).toHaveLength(1)
    expect(result.completed[0]?.kind).toBe('normal')
    expect(transactionModel.find).not.toHaveBeenCalled()
  })

  it('does not double-grant when claim loses race', async () => {
    const quest = baseQuest({
      condition: { type: 'casino_wins', threshold: 1 }
    })
    questModel.find.mockReturnValue(chainLean([quest]))
    userModel.findOne.mockReturnValue(
      chainLean({
        userId: 'u1',
        guildId: 'g1',
        dailyStreak: 0,
        questDailyStreak: 0,
        lastQuestDailyCompleteDate: null
      })
    )
    progressModel.findOne.mockReturnValue(chainLean(null))
    progressModel.findOneAndUpdate
      .mockResolvedValueOnce({}) // upsert
      .mockResolvedValueOnce(null) // claim lost
    transactionModel.find.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lean: vi
        .fn()
        .mockResolvedValue([
          { type: 'win', amount: 10, meta: { game: 'dice' } }
        ]),
      session: vi.fn().mockReturnThis()
    })

    const result = await evaluateAndGrantQuests({
      guildId: 'g1',
      userId: 'u1',
      models,
      timezone: 'UTC',
      now: new Date('2026-06-15T12:00:00.000Z')
    })

    expect(result.completed).toEqual([])
    expect(transactionModel.create).not.toHaveBeenCalled()
  })

  it('evaluates normal lifetime casino quests and nullish streaks', async () => {
    const quest = baseQuest({
      kind: 'normal',
      condition: { type: 'casino_wins', threshold: 1 },
      rewardAmount: 50
    })
    questModel.find.mockReturnValue(chainLean([quest]))
    userModel.findOne.mockReturnValue(
      chainLean({
        userId: 'u1',
        guildId: 'g1',
        lastQuestDailyCompleteDate: null
      })
    )
    progressModel.findOne.mockReturnValue(chainLean(null))
    progressModel.findOneAndUpdate
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ questId: 'q1', rewardedAt: new Date() })
    userModel.findOneAndUpdate.mockResolvedValue({})
    transactionModel.create.mockResolvedValue([])
    transactionModel.find.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lean: vi
        .fn()
        .mockResolvedValue([
          { type: 'win', amount: 10, meta: { game: 'dice' } }
        ]),
      session: vi.fn().mockReturnThis()
    })

    const result = await evaluateAndGrantQuests({
      guildId: 'g1',
      userId: 'u1',
      models,
      timezone: 'UTC',
      now: new Date('2026-06-15T12:00:00.000Z')
    })

    expect(result.completed).toHaveLength(1)
    expect(result.completed[0]?.dateKey).toBeNull()
  })

  it('skips zero reward grant body and handles streak race loss', async () => {
    const quest = baseQuest({
      condition: { type: 'casino_wins', threshold: 1 },
      rewardAmount: 0
    })
    questModel.find.mockReturnValue(chainLean([quest]))
    userModel.findOne.mockReturnValue(
      chainLean({
        userId: 'u1',
        guildId: 'g1',
        lastQuestDailyCompleteDate: null
      })
    )
    progressModel.findOne.mockReturnValue(chainLean(null))
    progressModel.findOneAndUpdate
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ questId: 'q1', rewardedAt: new Date() })
    userModel.findOneAndUpdate.mockResolvedValueOnce(null)
    transactionModel.find.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lean: vi
        .fn()
        .mockResolvedValue([
          { type: 'win', amount: 10, meta: { game: 'dice' } }
        ]),
      session: vi.fn().mockReturnThis()
    })

    const result = await evaluateAndGrantQuests({
      guildId: 'g1',
      userId: 'u1',
      models,
      timezone: 'UTC',
      now: new Date('2026-06-15T12:00:00.000Z'),
      session: { id: 'sess' } as never
    })

    expect(result.completed).toHaveLength(1)
    expect(transactionModel.create).not.toHaveBeenCalled()
  })

  it('reuses cached stats for matching quests', async () => {
    const quests = [
      baseQuest({
        questId: 'q1',
        condition: { type: 'casino_wins', threshold: 1, game: 'dice' }
      }),
      baseQuest({
        questId: 'q2',
        name: 'Second',
        condition: { type: 'casino_bets', threshold: 1, game: 'dice' }
      })
    ]
    questModel.find.mockReturnValue(chainLean(quests))
    userModel.findOne.mockReturnValue(
      chainLean({
        userId: 'u1',
        guildId: 'g1',
        dailyStreak: 0,
        questDailyStreak: 1,
        lastQuestDailyCompleteDate: '2026-06-15'
      })
    )
    progressModel.findOne.mockReturnValue(chainLean(null))
    progressModel.findOneAndUpdate.mockResolvedValue({})
    const lean = vi.fn().mockResolvedValue([
      { type: 'win', amount: 10, meta: { game: 'dice' } },
      { type: 'bet', amount: 5, meta: { game: 'dice' } }
    ])
    transactionModel.find.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lean,
      session: vi.fn().mockReturnThis()
    })

    await evaluateAndGrantQuests({
      guildId: 'g1',
      userId: 'u1',
      models,
      timezone: 'UTC',
      now: new Date('2026-06-15T12:00:00.000Z')
    })

    expect(lean).toHaveBeenCalledTimes(1)
  })
})
