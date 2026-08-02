import type { CasinoGameId } from '../constants/casinoGames'
import type { TCasinoSettings } from '../types/casinoSettings'

export const isCasinoGameEnabled = (
  settings: TCasinoSettings,
  gameId: CasinoGameId
): boolean => settings[gameId].enabled
