import {
  COMMON_TIMEZONES,
  type CurrencyPlacement,
  type GlobalSettings,
  defaultGlobalSettings
} from '../constants'

const coerceBool = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return fallback
}

const normalizeCurrencySymbol = (value: unknown): string => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return defaultGlobalSettings.currencySymbol
  }
  return value.slice(0, 8)
}

const normalizeCurrencyPlacement = (value: unknown): CurrencyPlacement =>
  value === 'suffix' ? 'suffix' : 'prefix'

const normalizeTimezone = (value: unknown): string => {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (
    raw.length > 0 &&
    (COMMON_TIMEZONES as readonly string[]).includes(raw)
  ) {
    return raw
  }
  return defaultGlobalSettings.timezone
}

export const normalizeGlobalSettings = (
  settings: Partial<GlobalSettings> | null | undefined
): GlobalSettings => ({
  disableRegistrations: coerceBool(
    settings?.disableRegistrations,
    defaultGlobalSettings.disableRegistrations
  ),
  disableDeposits: coerceBool(
    settings?.disableDeposits,
    defaultGlobalSettings.disableDeposits
  ),
  disableWithdrawals: coerceBool(
    settings?.disableWithdrawals,
    defaultGlobalSettings.disableWithdrawals
  ),
  disableCasinoGames: coerceBool(
    settings?.disableCasinoGames,
    defaultGlobalSettings.disableCasinoGames
  ),
  disableCasinoGamesForMods: coerceBool(
    settings?.disableCasinoGamesForMods,
    defaultGlobalSettings.disableCasinoGamesForMods
  ),
  disablePredictions: coerceBool(
    settings?.disablePredictions,
    defaultGlobalSettings.disablePredictions
  ),
  disablePredictionManagement: coerceBool(
    settings?.disablePredictionManagement,
    defaultGlobalSettings.disablePredictionManagement
  ),
  disableRaffles: coerceBool(
    settings?.disableRaffles,
    defaultGlobalSettings.disableRaffles
  ),
  disableRaffleManagement: coerceBool(
    settings?.disableRaffleManagement,
    defaultGlobalSettings.disableRaffleManagement
  ),
  disableDailyBonus: coerceBool(
    settings?.disableDailyBonus,
    defaultGlobalSettings.disableDailyBonus
  ),
  disableVip: coerceBool(
    settings?.disableVip,
    defaultGlobalSettings.disableVip
  ),
  maintenanceMode: coerceBool(
    settings?.maintenanceMode,
    defaultGlobalSettings.maintenanceMode
  ),
  timezone: normalizeTimezone(settings?.timezone),
  currencySymbol: normalizeCurrencySymbol(settings?.currencySymbol),
  currencyPlacement: normalizeCurrencyPlacement(settings?.currencyPlacement)
})
