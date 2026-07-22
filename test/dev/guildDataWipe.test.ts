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
  const keys: Array<keyof GuildDataWipeModels> = [
    'transactions',
    'atmRequests',
    'raffles',
    'predictions',
    'vipRooms',
    'blackjackGames',
    'minesGames',
    'userBans',
    'users'
  ]

  return Object.fromEntries(
    keys.map((key) => [
      key,
      {
        deleteMany: async () => ({ deletedCount: counts[key] ?? 0 })
      }
    ])
  ) as unknown as GuildDataWipeModels
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
      'mines',
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
      'mines',
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

    const summary = await runGuildDataWipe({
      guildId: 'guild-1',
      entities: ['transactions', 'users'],
      models
    })

    expect(deleted).toEqual(['transactions', 'userBans', 'users'])
    expect(summary.deleted).toEqual({
      transactions: 3,
      userBans: 1,
      users: 2
    })
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
      'minesGames',
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
