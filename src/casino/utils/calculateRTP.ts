import {
  BACCARAT_8_DECK_PROBS,
  BLACKJACK_OUTCOME_PROBS,
  EUROPEAN_NUMBERS,
  LOTTERY_NUM_TO_DRAW,
  LOTTERY_TOTAL_NUMBERS,
  PLINKO_ROW_COUNT,
  calculateBlackjackInsuranceRtp,
  calculateBlackjackPairsRtp,
  calculateHiloRtp,
  defaultCasinoSettings,
  getPlinkoMultiplierAtPathIndex,
  normalizePlinkoBinMultipliers
} from '../constants'
import type { TCasinoSettings } from '../types/casinoSettings'
import { calculateBlackjackPlusThreeRtp } from './blackjackPlusThreeRtp'
import {
  isBlackjackInsuranceEnabled,
  isBlackjackPairsEnabled,
  isBlackjackPlusThreeEnabled
} from './getBlackjackPayout'

const combination = (n: number, k: number): number => {
  let result = 1
  for (let i = 1; i <= k; i++) {
    result = (result * (n - i + 1)) / i
  }
  return result
}

export const calculateRTP = (
  game: keyof TCasinoSettings,
  settings: TCasinoSettings[typeof game]
): number | Record<string, number> => {
  const toNumber = (val: unknown): number => {
    if (typeof val === 'string') return parseFloat(val) || 0
    if (typeof val === 'number') return val
    return 0
  }

  switch (game) {
    case 'dice': {
      const { winMultiplier } = settings as TCasinoSettings['dice']
      return (1 / 6) * toNumber(winMultiplier) * 100
    }

    case 'coinflip': {
      const { winMultiplier } = settings as TCasinoSettings['coinflip']
      return 0.5 * toNumber(winMultiplier) * 100
    }

    case 'hilo': {
      const { houseEdge } = settings as TCasinoSettings['hilo']
      return calculateHiloRtp(toNumber(houseEdge))
    }

    case 'limbo': {
      const { houseEdge } = settings as TCasinoSettings['limbo']
      return (1 - toNumber(houseEdge)) * 100
    }

    case 'mines': {
      const { houseEdge } = settings as TCasinoSettings['mines']
      return (1 - toNumber(houseEdge)) * 100
    }

    case 'slots': {
      const { symbolWeights, winMultipliers } =
        settings as TCasinoSettings['slots']

      const multipliers = winMultipliers as Record<string, number>

      const totalWeight = Object.values(symbolWeights).reduce(
        (a, b) => a + toNumber(b),
        0
      )

      let rtp = 0
      for (const [symbol, weight] of Object.entries(symbolWeights)) {
        const probability = Math.pow(toNumber(weight) / totalWeight, 3)
        const combo = symbol + symbol + symbol
        const multiplier = toNumber(multipliers[combo] ?? 0)
        rtp += probability * multiplier
      }

      return rtp * 100
    }

    case 'lottery': {
      const { winMultipliers } = settings as TCasinoSettings['lottery']

      const multipliers = winMultipliers as Record<number, number>

      const userPicks = LOTTERY_NUM_TO_DRAW
      const drawnNumbers = LOTTERY_NUM_TO_DRAW

      let rtp = 0

      for (let k = 0; k <= userPicks; k++) {
        const favorable =
          combination(userPicks, k) *
          combination(LOTTERY_TOTAL_NUMBERS - userPicks, drawnNumbers - k)

        const probability =
          favorable / combination(LOTTERY_TOTAL_NUMBERS, drawnNumbers)

        const multiplier = toNumber(multipliers[k] ?? 0)

        rtp += probability * multiplier
      }

      return rtp * 100
    }

    case 'roulette': {
      const { winMultipliers } = settings as TCasinoSettings['roulette']
      const numbers = Object.keys(EUROPEAN_NUMBERS)
      const totalNumbers = numbers.length

      const numberRTP =
        (1 / totalNumbers) * toNumber(winMultipliers.number) * 100

      const redCount = numbers.filter(
        (n) => EUROPEAN_NUMBERS[n] === 'red'
      ).length
      const colorRTP =
        (redCount / totalNumbers) * toNumber(winMultipliers.color) * 100

      const evenCount = numbers.filter(
        (n) => parseInt(n) % 2 === 0 && EUROPEAN_NUMBERS[n] !== 'green'
      ).length
      const parityRTP =
        (evenCount / totalNumbers) * toNumber(winMultipliers.parity) * 100

      const rangeCount = numbers.filter(
        (n) => parseInt(n) >= 1 && parseInt(n) <= 18
      ).length
      const rangeRTP =
        (rangeCount / totalNumbers) * toNumber(winMultipliers.range) * 100

      const dozenCount = numbers.filter(
        (n) => parseInt(n) >= 1 && parseInt(n) <= 12
      ).length
      const dozenRTP =
        (dozenCount / totalNumbers) * toNumber(winMultipliers.dozen) * 100

      const columnCount = numbers.filter(
        (n) => parseInt(n) % 3 === 1 && EUROPEAN_NUMBERS[n] !== 'green'
      ).length
      const columnRTP =
        (columnCount / totalNumbers) * toNumber(winMultipliers.column) * 100

      return {
        number: numberRTP,
        color: colorRTP,
        parity: parityRTP,
        range: rangeRTP,
        dozen: dozenRTP,
        column: columnRTP
      }
    }

    case 'baccarat': {
      const baccarat = settings as TCasinoSettings['baccarat']
      const { winMultipliers, dragonBonusMultipliers, lucky6Multipliers } =
        baccarat
      const p = BACCARAT_8_DECK_PROBS

      // Player/banker push on tie (return stake = 1x). Side bets are independent.
      const playerRTP =
        (p.player * toNumber(winMultipliers.player) + p.tie * 1) * 100
      const bankerRTP =
        (p.banker * toNumber(winMultipliers.banker) + p.tie * 1) * 100
      const tieRTP = p.tie * toNumber(winMultipliers.tie) * 100
      const playerPairRTP =
        p.playerPair * toNumber(winMultipliers.playerPair) * 100
      const bankerPairRTP =
        p.bankerPair * toNumber(winMultipliers.bankerPair) * 100
      const eitherPairRTP =
        p.eitherPair * toNumber(winMultipliers.eitherPair) * 100
      const perfectPairRTP =
        p.perfectPair * toNumber(winMultipliers.perfectPair) * 100
      const bigRTP = p.big * toNumber(winMultipliers.big) * 100
      const smallRTP = p.small * toNumber(winMultipliers.small) * 100

      const dragonRtp = (
        events: {
          winBy9: number
          winBy8: number
          winBy7: number
          winBy6: number
          winBy5: number
          winBy4: number
          naturalWin: number
          naturalTie: number
        },
        mults: typeof dragonBonusMultipliers
      ) =>
        (events.winBy9 * toNumber(mults.winBy9) +
          events.winBy8 * toNumber(mults.winBy8) +
          events.winBy7 * toNumber(mults.winBy7) +
          events.winBy6 * toNumber(mults.winBy6) +
          events.winBy5 * toNumber(mults.winBy5) +
          events.winBy4 * toNumber(mults.winBy4) +
          events.naturalWin * toNumber(mults.naturalWin) +
          events.naturalTie * 1) *
        100

      const lucky6RTP =
        (p.lucky6.twoCard * toNumber(lucky6Multipliers.twoCard) +
          p.lucky6.threeCard * toNumber(lucky6Multipliers.threeCard)) *
        100

      return {
        player: playerRTP,
        banker: bankerRTP,
        tie: tieRTP,
        playerPair: playerPairRTP,
        bankerPair: bankerPairRTP,
        eitherPair: eitherPairRTP,
        perfectPair: perfectPairRTP,
        big: bigRTP,
        small: smallRTP,
        playerDragonBonus: dragonRtp(
          p.playerDragonBonus,
          dragonBonusMultipliers
        ),
        bankerDragonBonus: dragonRtp(
          p.bankerDragonBonus,
          dragonBonusMultipliers
        ),
        lucky6: lucky6RTP
      }
    }

    case 'rps': {
      const { houseEdge } = settings as TCasinoSettings['rps']
      return (1 - toNumber(houseEdge)) * 100
    }

    case 'goldenJackpot': {
      const { winMultiplier, oneInChance } =
        settings as TCasinoSettings['goldenJackpot']
      return (toNumber(winMultiplier) / toNumber(oneInChance)) * 100
    }

    case 'raffle': {
      const { houseEdge } = settings as TCasinoSettings['raffle']
      return (1 - toNumber(houseEdge)) * 100
    }

    case 'blackjack': {
      const blackjack = settings as TCasinoSettings['blackjack']
      const multipliers = {
        ...defaultCasinoSettings.blackjack.winMultipliers,
        ...blackjack.winMultipliers
      }
      const pairsMultipliers = {
        ...defaultCasinoSettings.blackjack.pairsMultipliers,
        ...blackjack.pairsMultipliers
      }
      const plusThreeMultipliers = {
        ...defaultCasinoSettings.blackjack.plusThreeMultipliers,
        ...blackjack.plusThreeMultipliers
      }
      const p = BLACKJACK_OUTCOME_PROBS

      const main =
        (p.win * toNumber(multipliers.win) +
          p.blackjack * toNumber(multipliers.blackjack) +
          p.push * toNumber(multipliers.push)) *
        100

      const rtp: Record<string, number> = { main }
      if (isBlackjackPairsEnabled(pairsMultipliers)) {
        rtp.pairs = calculateBlackjackPairsRtp(
          blackjack.deckCount,
          pairsMultipliers
        )
      }
      if (isBlackjackInsuranceEnabled(multipliers)) {
        rtp.insurance = calculateBlackjackInsuranceRtp(
          blackjack.deckCount,
          multipliers.insurance
        )
      }
      if (isBlackjackPlusThreeEnabled(plusThreeMultipliers)) {
        rtp['21+3'] = calculateBlackjackPlusThreeRtp(
          blackjack.deckCount,
          plusThreeMultipliers
        )
      }
      return rtp
    }

    case 'prediction':
      return 0

    case 'plinko': {
      const { binMultipliers } = settings as TCasinoSettings['plinko']
      const multipliers = normalizePlinkoBinMultipliers(binMultipliers)
      const N = PLINKO_ROW_COUNT
      const p = 0.5

      let rtp = 0

      for (let k = 0; k <= N; k++) {
        const probability =
          combination(N, k) * Math.pow(p, k) * Math.pow(1 - p, N - k)

        rtp += probability * getPlinkoMultiplierAtPathIndex(multipliers, k)
      }

      return rtp * 100
    }

    default:
      if (game !== 'winAnnouncements') {
        console.warn(`RTP for ${game} not implemented`)
      }
      return 0
  }
}
