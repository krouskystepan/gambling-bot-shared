import { MINI_NUMBERS } from '../constants/rouletteConfig'
import type { TCasinoSettings } from '../types/casinoSettings'

export type RouletteBetType =
  keyof TCasinoSettings['roulette']['winMultipliers']

export type RouletteBet = {
  type: RouletteBetType
  value: string
  amount: number
}

export type RouletteWinMultipliers =
  TCasinoSettings['roulette']['winMultipliers']

export function calculateRouletteWin(
  bet: RouletteBet,
  result: string,
  payouts: RouletteWinMultipliers
): number {
  const amount = bet.amount
  const numResult = Number(result)

  switch (bet.type) {
    case 'number':
      return bet.value === result ? amount * payouts.number : 0

    case 'color':
      if (result === '0') return 0
      return MINI_NUMBERS[result] === bet.value.toLowerCase()
        ? amount * payouts.color
        : 0

    case 'parity':
      if (result === '0') return 0
      return bet.value.toLowerCase() === (numResult % 2 === 0 ? 'even' : 'odd')
        ? amount * payouts.parity
        : 0

    case 'range':
      if (result === '0') return 0
      return bet.value.toLowerCase() ===
        (numResult >= 1 && numResult <= 9 ? 'low' : 'high')
        ? amount * payouts.range
        : 0

    case 'dozen':
      if (result === '0') return 0
      return Number(bet.value) === Math.ceil(numResult / 6)
        ? amount * payouts.dozen
        : 0

    case 'column':
      if (result === '0') return 0
      return Number(bet.value) === ((numResult - 1) % 3) + 1
        ? amount * payouts.column
        : 0

    default:
      return 0
  }
}
