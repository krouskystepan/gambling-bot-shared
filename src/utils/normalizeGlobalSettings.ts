import {
  COMMON_TIMEZONES,
  type GlobalSettings,
  defaultGlobalSettings
} from '../constants'

const coerceBool = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return fallback
}

const trimCurrencyCode = (value: unknown): string => {
  const raw = typeof value === 'string' ? value.trim().toUpperCase() : ''
  const code = raw.slice(0, 3)
  return /^[A-Z]{3}$/.test(code) ? code : defaultGlobalSettings.currencyCode
}

const trimCurrencySymbol = (value: unknown): string => {
  const raw = typeof value === 'string' ? value.trim() : ''
  return raw.length > 0 ? raw.slice(0, 8) : defaultGlobalSettings.currencySymbol
}

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
  currencyCode: trimCurrencyCode(settings?.currencyCode),
  currencySymbol: trimCurrencySymbol(settings?.currencySymbol)
})
