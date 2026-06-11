import { defaultCasinoSettings } from './defaultConfig'

export type CasinoGameId = Exclude<
  keyof typeof defaultCasinoSettings,
  'winAnnouncements'
>

export const CASINO_GAME_IDS = Object.keys(defaultCasinoSettings).filter(
  (key): key is CasinoGameId => key !== 'winAnnouncements'
)
