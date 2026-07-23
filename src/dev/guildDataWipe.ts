import { formatNumberToReadableString } from '../common/formatters'

export type GuildWipeEntity =
  | 'all'
  | 'users'
  | 'transactions'
  | 'atm'
  | 'raffles'
  | 'predictions'
  | 'vip'
  | 'blackjack'
  | 'baccarat'
  | 'mines'

export type GuildDataWipeDeleteResult = {
  deletedCount?: number
}

export type GuildDataWipeModel = {
  deleteMany: (filter: {
    guildId: string
  }) => Promise<GuildDataWipeDeleteResult>
}

export type GuildDataWipeModels = {
  transactions: GuildDataWipeModel
  atmRequests: GuildDataWipeModel
  raffles: GuildDataWipeModel
  predictions: GuildDataWipeModel
  vipRooms: GuildDataWipeModel
  blackjackGames: GuildDataWipeModel
  baccaratGames: GuildDataWipeModel
  minesGames: GuildDataWipeModel
  userBans: GuildDataWipeModel
  users: GuildDataWipeModel
}

export type GuildDataWipeSummary = {
  entities: GuildWipeEntity[]
  deleted: Record<string, number>
}

type WipeTarget = {
  key: keyof GuildDataWipeModels
  label: string
  entity: Exclude<GuildWipeEntity, 'all'>
  run: () => Promise<number>
}

const WIPE_ENTITY_ORDER: Exclude<GuildWipeEntity, 'all'>[] = [
  'transactions',
  'atm',
  'raffles',
  'predictions',
  'vip',
  'blackjack',
  'baccarat',
  'mines',
  'users'
]

const ENTITY_TO_MODEL_KEY: Record<
  Exclude<GuildWipeEntity, 'all'>,
  keyof GuildDataWipeModels
> = {
  transactions: 'transactions',
  atm: 'atmRequests',
  raffles: 'raffles',
  predictions: 'predictions',
  vip: 'vipRooms',
  blackjack: 'blackjackGames',
  baccarat: 'baccaratGames',
  mines: 'minesGames',
  users: 'users'
}

const WIPE_LABELS: Record<keyof GuildDataWipeModels, string> = {
  transactions: 'Transactions',
  atmRequests: 'ATM requests',
  raffles: 'Raffles',
  predictions: 'Predictions',
  vipRooms: 'VIP rooms',
  blackjackGames: 'Blackjack games',
  baccaratGames: 'Baccarat games',
  minesGames: 'Mines games',
  userBans: 'User bans',
  users: 'Users'
}

async function countDeleted(
  result: GuildDataWipeDeleteResult
): Promise<number> {
  return result.deletedCount ?? 0
}

export function normalizeGuildWipeEntities(
  entities: GuildWipeEntity[]
): Exclude<GuildWipeEntity, 'all'>[] {
  const withoutAll = entities.filter(
    (entity): entity is Exclude<GuildWipeEntity, 'all'> => entity !== 'all'
  )

  if (withoutAll.length !== entities.length) {
    return [...WIPE_ENTITY_ORDER]
  }

  const selected = new Set(withoutAll)

  return WIPE_ENTITY_ORDER.filter((entity) => selected.has(entity))
}

function buildWipeTargets(
  guildId: string,
  entities: Exclude<GuildWipeEntity, 'all'>[],
  models: GuildDataWipeModels
): WipeTarget[] {
  const selected = new Set(entities)

  return WIPE_ENTITY_ORDER.filter((entity) => selected.has(entity)).flatMap(
    (entity) => {
      const targets: WipeTarget[] = []

      if (entity === 'users') {
        targets.push({
          key: 'userBans',
          label: WIPE_LABELS.userBans,
          entity,
          run: async () =>
            countDeleted(await models.userBans.deleteMany({ guildId }))
        })
      }

      const key = ENTITY_TO_MODEL_KEY[entity]
      targets.push({
        key,
        label: WIPE_LABELS[key],
        entity,
        run: async () => countDeleted(await models[key].deleteMany({ guildId }))
      })

      return targets
    }
  )
}

export async function runGuildDataWipe({
  guildId,
  entities,
  models
}: {
  guildId: string
  entities: GuildWipeEntity[]
  models: GuildDataWipeModels
}): Promise<GuildDataWipeSummary> {
  const normalizedEntities = normalizeGuildWipeEntities(entities)
  const targets = buildWipeTargets(guildId, normalizedEntities, models)
  const deleted: Record<string, number> = {}

  for (const target of targets) {
    deleted[target.key] = await target.run()
  }

  return {
    entities: normalizedEntities,
    deleted
  }
}

export function formatGuildDataWipeSummary(
  summary: GuildDataWipeSummary
): string {
  const lines = Object.entries(summary.deleted)
    .filter(([, count]) => count > 0)
    .map(
      ([key, count]) =>
        `• **${WIPE_LABELS[key as keyof GuildDataWipeModels] ?? key}**: ${formatNumberToReadableString(count)} removed`
    )

  if (lines.length === 0) {
    return 'Nothing to remove - guild operational data was already empty.'
  }

  return lines.join('\n')
}
