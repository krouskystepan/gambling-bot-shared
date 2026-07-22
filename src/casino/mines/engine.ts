import {
  MINES_CELL_COUNT,
  getMinesPayoutMultiplier
} from '../constants/minesConfig'
import type { MinesGameStatus, TMinesGame } from '../types/minesGame'

export type MinesEngineState = {
  betAmount: number
  mineCount: number
  mineIndices: number[]
  revealedIndices: number[]
  houseEdgeSnapshot: number
  status: MinesGameStatus
}

export type MinesRevealResult =
  | {
      kind: 'SAFE'
      cellIndex: number
      revealedIndices: number[]
      multiplier: number
      /** True when every safe cell is revealed (auto cash-out eligible). */
      boardCleared: boolean
    }
  | {
      kind: 'MINE'
      cellIndex: number
      revealedIndices: number[]
      status: 'FINISHED'
    }
  | {
      kind: 'IGNORED'
      reason: 'FINISHED' | 'ALREADY_REVEALED' | 'INVALID_INDEX'
    }

export type MinesCashOutResult =
  | {
      kind: 'OK'
      multiplier: number
      payout: number
      status: 'FINISHED'
    }
  | {
      kind: 'IGNORED'
      reason: 'FINISHED' | 'NO_REVEALS'
    }

/** Fisher-Yates shuffle of `0..cellCount-1`, then take first `mineCount`. */
export const placeMines = (
  mineCount: number,
  random01: () => number = Math.random,
  cellCount: number = MINES_CELL_COUNT
): number[] => {
  if (!Number.isInteger(mineCount) || mineCount < 1 || mineCount >= cellCount) {
    throw new Error('INVALID_MINE_COUNT')
  }

  const indices = Array.from({ length: cellCount }, (_, i) => i)
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(random01() * (i + 1))
    const tmp = indices[i]!
    indices[i] = indices[j]!
    indices[j] = tmp
  }
  return indices.slice(0, mineCount).sort((a, b) => a - b)
}

export const createMinesEngine = (params: {
  betAmount: number
  mineCount: number
  houseEdgeSnapshot: number
  mineIndices?: number[]
  random01?: () => number
}): MinesEngineState => {
  const mineIndices =
    params.mineIndices ??
    placeMines(params.mineCount, params.random01 ?? Math.random)

  return {
    betAmount: params.betAmount,
    mineCount: params.mineCount,
    mineIndices,
    revealedIndices: [],
    houseEdgeSnapshot: params.houseEdgeSnapshot,
    status: 'ACTIVE'
  }
}

export const docToMinesEngine = (
  doc: Pick<
    TMinesGame,
    | 'betAmount'
    | 'mineCount'
    | 'mineIndices'
    | 'revealedIndices'
    | 'houseEdgeSnapshot'
    | 'status'
  >
): MinesEngineState => ({
  betAmount: doc.betAmount,
  mineCount: doc.mineCount,
  mineIndices: [...doc.mineIndices],
  revealedIndices: [...doc.revealedIndices],
  houseEdgeSnapshot: doc.houseEdgeSnapshot,
  status: doc.status
})

export const isMinesFinished = (state: MinesEngineState): boolean =>
  state.status === 'FINISHED'

export const isMinesBust = (state: MinesEngineState): boolean =>
  state.status === 'FINISHED' &&
  state.revealedIndices.some((i) => state.mineIndices.includes(i))

export const currentMinesMultiplier = (state: MinesEngineState): number =>
  getMinesPayoutMultiplier(
    state.mineCount,
    state.revealedIndices.length,
    state.houseEdgeSnapshot
  )

export const revealCell = (
  state: MinesEngineState,
  cellIndex: number
): MinesRevealResult => {
  if (state.status !== 'ACTIVE') {
    return { kind: 'IGNORED', reason: 'FINISHED' }
  }

  if (
    !Number.isInteger(cellIndex) ||
    cellIndex < 0 ||
    cellIndex >= MINES_CELL_COUNT
  ) {
    return { kind: 'IGNORED', reason: 'INVALID_INDEX' }
  }

  if (state.revealedIndices.includes(cellIndex)) {
    return { kind: 'IGNORED', reason: 'ALREADY_REVEALED' }
  }

  if (state.mineIndices.includes(cellIndex)) {
    state.revealedIndices = [...state.revealedIndices, cellIndex]
    state.status = 'FINISHED'
    return {
      kind: 'MINE',
      cellIndex,
      revealedIndices: [...state.revealedIndices],
      status: 'FINISHED'
    }
  }

  state.revealedIndices = [...state.revealedIndices, cellIndex]
  const safeTotal = MINES_CELL_COUNT - state.mineCount
  const boardCleared = state.revealedIndices.length >= safeTotal
  const multiplier = currentMinesMultiplier(state)

  return {
    kind: 'SAFE',
    cellIndex,
    revealedIndices: [...state.revealedIndices],
    multiplier,
    boardCleared
  }
}

export const cashOutPayout = (state: MinesEngineState): MinesCashOutResult => {
  if (state.status !== 'ACTIVE') {
    return { kind: 'IGNORED', reason: 'FINISHED' }
  }

  if (state.revealedIndices.length < 1) {
    return { kind: 'IGNORED', reason: 'NO_REVEALS' }
  }

  const multiplier = currentMinesMultiplier(state)
  const payout = state.betAmount * multiplier
  state.status = 'FINISHED'

  return {
    kind: 'OK',
    multiplier,
    payout,
    status: 'FINISHED'
  }
}

/** Settle as cash-out if any safe reveals, else forfeit (payout 0). */
export const resolveIdleMines = (
  state: MinesEngineState
): { payout: number; multiplier: number; forfeited: boolean } => {
  if (state.status !== 'ACTIVE') {
    return { payout: 0, multiplier: 0, forfeited: true }
  }

  if (state.revealedIndices.length >= 1) {
    const multiplier = currentMinesMultiplier(state)
    const payout = state.betAmount * multiplier
    state.status = 'FINISHED'
    return { payout, multiplier, forfeited: false }
  }

  state.status = 'FINISHED'
  return { payout: 0, multiplier: 0, forfeited: true }
}
