import type { TGuildConfiguration } from '../types/guildConfiguration'

export function isWorkerLogChannelConfigured(
  config: Pick<TGuildConfiguration, 'workerLogChannelId'> | null | undefined
): boolean {
  return Boolean(config?.workerLogChannelId)
}
