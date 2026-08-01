import { describe, expect, it } from 'vitest'

import {
  type GuildDataWipeModels,
  formatGuildDataWipeSummary,
  normalizeGuildWipeEntities,
  runGuildDataWipe
} from '../../src/dev/guildDataWipe'

function createMockModels(
  counts: Partial<Record<keyof GuildDataWipeModels, number>> = {}
): GuildDataWipeModels {
  const deleteModel = (
    key: Exclude<keyof GuildDataWipeModels, 'userQuestStreaks'>
  ): GuildDataWipeModels[Exclude<
    keyof GuildDataWipeModels,
    'userQuestStreaks'
  >] => ({
    deleteMany: async () => ({ deletedCount: counts[key] ?? 0 })
  })

  return {
    transactions: deleteModel('transactions'),
    atmRequests: deleteModel('atmRequests'),
    raffles: deleteModel('raffles'),
    predictions: deleteModel('predictions'),
    vipRooms: deleteModel('vipRooms'),
    blackjackGames: deleteModel('blackjackGames'),
    baccaratGames: deleteModel('baccaratGames'),
    minesGames: deleteModel('minesGames'),
    rouletteGames: deleteModel('rouletteGames'),
    slotsGames: deleteModel('slotsGames'),
    userQuestProgress: deleteModel('userQuestProgress'),
    userBans: deleteModel('userBans'),
    users: deleteModel('users'),
    userQuestStreaks: {
      resetMany: async () => ({ modifiedCount: counts.userQuestStreaks ?? 0 })
    }
  }
}

describe('normalizeGuildWipeEntities', () => {
  it('expands all to every operational entity in deletion order', () => {
    expect(normalizeGuildWipeEntities(['all'])).toEqual([
      'transactions',
      'atm',
      'raffles',
      'predictions',
      'vip',
      'blackjack',
      'baccarat',
      'mines',
      'roulette',
      'slots',
      'quests',
      'users'
    ])
  })

  it('deduplicates and orders selected entities', () => {
    expect(
      normalizeGuildWipeEntities(['users', 'transactions', 'users', 'atm'])
    ).toEqual(['transactions', 'atm', 'users'])
  })

  it('treats mixed all selections as a full wipe', () => {
    expect(
      normalizeGuildWipeEntities(['users', 'all', 'transactions'])
    ).toEqual([
      'transactions',
      'atm',
      'raffles',
      'predictions',
      'vip',
      'blackjack',
      'baccarat',
      'mines',
      'roulette',
      'slots',
      'quests',
      'users'
    ])
  })
})

describe('runGuildDataWipe', () => {
  it('wipes only selected collections', async () => {
    const deleted: string[] = []
    const models = createMockModels({
      transactions: 3,
      users: 2
    })

    models.transactions.deleteMany = async () => {
      deleted.push('transactions')
      return { deletedCount: 3 }
    }
    models.users.deleteMany = async () => {
      deleted.push('users')
      return { deletedCount: 2 }
    }
    models.userBans.deleteMany = async () => {
      deleted.push('userBans')
      return { deletedCount: 1 }
    }
    models.userQuestProgress.deleteMany = async () => {
      deleted.push('userQuestProgress')
      return { deletedCount: 4 }
    }

    const summary = await runGuildDataWipe({
      guildId: 'guild-1',
      entities: ['transactions', 'users'],
      models
    })

    expect(deleted).toEqual([
      'transactions',
      'userBans',
      'userQuestProgress',
      'users'
    ])
    expect(summary.deleted).toEqual({
      transactions: 3,
      userBans: 1,
      userQuestProgress: 4,
      users: 2
    })
  })

  it('wipes quest progress and resets streaks', async () => {
    const deleted: string[] = []
    const models = createMockModels({
      userQuestProgress: 7,
      userQuestStreaks: 5
    })

    models.userQuestProgress.deleteMany = async () => {
      deleted.push('userQuestProgress')
      return { deletedCount: 7 }
    }
    models.userQuestStreaks.resetMany = async () => {
      deleted.push('userQuestStreaks')
      return { modifiedCount: 5 }
    }

    const summary = await runGuildDataWipe({
      guildId: 'guild-1',
      entities: ['quests'],
      models
    })

    expect(deleted).toEqual(['userQuestProgress', 'userQuestStreaks'])
    expect(summary.deleted).toEqual({
      userQuestProgress: 7,
      userQuestStreaks: 5
    })
  })

  it('treats missing modifiedCount on streak reset as zero', async () => {
    const models = createMockModels()
    models.userQuestProgress.deleteMany = async () => ({ deletedCount: 1 })
    models.userQuestStreaks.resetMany = async () => ({})

    const summary = await runGuildDataWipe({
      guildId: 'guild-1',
      entities: ['quests'],
      models
    })

    expect(summary.deleted).toEqual({
      userQuestProgress: 1,
      userQuestStreaks: 0
    })
  })

  it('does not double-delete quest progress when quests and users are selected', async () => {
    const deleted: string[] = []
    const models = createMockModels()

    models.userQuestProgress.deleteMany = async () => {
      deleted.push('userQuestProgress')
      return { deletedCount: 2 }
    }
    models.userQuestStreaks.resetMany = async () => {
      deleted.push('userQuestStreaks')
      return { modifiedCount: 1 }
    }
    models.userBans.deleteMany = async () => {
      deleted.push('userBans')
      return { deletedCount: 0 }
    }
    models.users.deleteMany = async () => {
      deleted.push('users')
      return { deletedCount: 1 }
    }

    await runGuildDataWipe({
      guildId: 'guild-1',
      entities: ['quests', 'users'],
      models
    })

    expect(deleted).toEqual([
      'userQuestProgress',
      'userQuestStreaks',
      'userBans',
      'users'
    ])
  })

  it('treats missing deletedCount as zero', async () => {
    const models = createMockModels()
    models.transactions.deleteMany = async () => ({})

    const summary = await runGuildDataWipe({
      guildId: 'guild-1',
      entities: ['transactions'],
      models
    })

    expect(summary.deleted).toEqual({ transactions: 0 })
  })

  it('wipes all collections in dependency-safe order', async () => {
    const deleted: string[] = []
    const models = createMockModels()

    for (const key of Object.keys(models) as Array<keyof GuildDataWipeModels>) {
      if (key === 'userQuestStreaks') {
        models.userQuestStreaks.resetMany = async () => {
          deleted.push(key)
          return { modifiedCount: 1 }
        }
        continue
      }

      models[key].deleteMany = async () => {
        deleted.push(key)
        return { deletedCount: 1 }
      }
    }

    await runGuildDataWipe({
      guildId: 'guild-1',
      entities: ['all'],
      models
    })

    expect(deleted).toEqual([
      'transactions',
      'atmRequests',
      'raffles',
      'predictions',
      'vipRooms',
      'blackjackGames',
      'baccaratGames',
      'minesGames',
      'rouletteGames',
      'slotsGames',
      'userQuestProgress',
      'userQuestStreaks',
      'userBans',
      'users'
    ])
  })
})

describe('formatGuildDataWipeSummary', () => {
  it('formats non-zero deletions', () => {
    const text = formatGuildDataWipeSummary({
      entities: ['transactions'],
      deleted: { transactions: 12 }
    })

    expect(text).toContain('Transactions')
    expect(text).toContain('12')
  })

  it('reports empty guild data', () => {
    expect(
      formatGuildDataWipeSummary({
        entities: ['users'],
        deleted: { users: 0 }
      })
    ).toBe('Nothing to remove - guild operational data was already empty.')
  })

  it('falls back to the raw key for unknown deletion buckets', () => {
    const text = formatGuildDataWipeSummary({
      entities: ['users'],
      deleted: { mysteryBucket: 4 }
    })

    expect(text).toContain('mysteryBucket')
    expect(text).toContain('4')
  })
})
