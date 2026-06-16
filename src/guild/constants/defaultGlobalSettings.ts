export type CurrencyPlacement = 'prefix' | 'suffix'

export type GlobalSettings = {
  disableRegistrations: boolean
  disableDeposits: boolean
  disableWithdrawals: boolean
  disableCasinoGames: boolean
  disableCasinoGamesForMods: boolean
  disablePredictions: boolean
  disablePredictionManagement: boolean
  disableRaffles: boolean
  disableRaffleManagement: boolean
  disableDailyBonus: boolean
  disableVip: boolean
  maintenanceMode: boolean
  timezone: string
  currencySymbol: string
  /** prefix: symbol before amount ($1.5k). suffix: symbol after amount (1.5kCZK). Spacing is part of currencySymbol. */
  currencyPlacement: CurrencyPlacement
}

export const defaultGlobalSettings: GlobalSettings = {
  disableRegistrations: false,
  disableDeposits: false,
  disableWithdrawals: false,
  disableCasinoGames: false,
  disableCasinoGamesForMods: false,
  disablePredictions: false,
  disablePredictionManagement: false,
  disableRaffles: false,
  disableRaffleManagement: false,
  disableDailyBonus: false,
  disableVip: false,
  maintenanceMode: false,
  timezone: 'UTC',
  currencySymbol: '$',
  currencyPlacement: 'prefix'
}
