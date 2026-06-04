import type { GlobalSettings } from '../constants/defaultGlobalSettings'
import type { TGuildConfiguration } from '../types/guildConfiguration'

export type GlobalFeature =
  | 'registration'
  | 'deposit'
  | 'withdraw'
  | 'casinoGames'
  | 'casinoGamesForMods'
  | 'predictions'
  | 'predictionManagement'
  | 'raffles'
  | 'raffleManagement'
  | 'dailyBonus'
  | 'vip'
  | 'maintenance'

export function isGlobalFeatureDisabled(
  config: TGuildConfiguration | null | undefined,
  feature: GlobalFeature
): boolean {
  const settings = config?.globalSettings
  if (!settings) return false

  switch (feature) {
    case 'registration':
      return settings.disableRegistrations
    case 'deposit':
      return settings.disableDeposits
    case 'withdraw':
      return settings.disableWithdrawals
    case 'casinoGames':
      return settings.disableCasinoGames
    case 'casinoGamesForMods':
      return settings.disableCasinoGamesForMods
    case 'predictions':
      return settings.disablePredictions
    case 'predictionManagement':
      return settings.disablePredictionManagement
    case 'raffles':
      return settings.disableRaffles
    case 'raffleManagement':
      return settings.disableRaffleManagement
    case 'dailyBonus':
      return settings.disableDailyBonus
    case 'vip':
      return settings.disableVip
    case 'maintenance':
      return settings.maintenanceMode
    default: {
      const _exhaustive: never = feature
      return _exhaustive
    }
  }
}

export const getCurrencySymbol = (
  globalSettings?: Partial<GlobalSettings> | null
): string => globalSettings?.currencySymbol?.trim() || '$'
