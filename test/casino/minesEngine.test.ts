import {
  cashOutPayout,
  createMinesEngine,
  currentMinesMultiplier,
  docToMinesEngine,
  isMinesBust,
  isMinesFinished,
  placeMines,
  resolveIdleMines,
  revealCell
} from 'gambling-bot-shared/casino'
import { describe, expect, it } from 'vitest'

describe('mines engine', () => {
  const houseEdge = 0.03
  // Mines only on cells 0 and 1 for deterministic board of 20.
  const mineIndices = [0, 1]

  const start = () =>
    createMinesEngine({
      betAmount: 100,
      mineCount: 2,
      houseEdgeSnapshot: houseEdge,
      mineIndices
    })

  it('places the requested number of unique mines', () => {
    let i = 0
    const sequence = [0.9, 0.1, 0.5, 0.2, 0.8]
    const mines = placeMines(3, () => sequence[i++ % sequence.length]!)
    expect(mines).toHaveLength(3)
    expect(new Set(mines).size).toBe(3)
    expect([...mines].sort((a, b) => a - b)).toEqual(mines)
  })

  it('rejects invalid mine counts when placing', () => {
    expect(() => placeMines(0)).toThrow('INVALID_MINE_COUNT')
    expect(() => placeMines(20)).toThrow('INVALID_MINE_COUNT')
  })

  it('progresses multiplier on safe reveals', () => {
    const state = start()
    const first = revealCell(state, 2)
    expect(first.kind).toBe('SAFE')
    if (first.kind !== 'SAFE') return
    expect(first.multiplier).toBeCloseTo(currentMinesMultiplier(state), 10)
    expect(first.multiplier).toBeGreaterThan(1)

    const second = revealCell(state, 3)
    expect(second.kind).toBe('SAFE')
    if (second.kind !== 'SAFE') return
    expect(second.multiplier).toBeGreaterThan(first.multiplier)
    expect(isMinesFinished(state)).toBe(false)
  })

  it('busts on mine and finishes', () => {
    const state = start()
    const hit = revealCell(state, 0)
    expect(hit).toEqual(
      expect.objectContaining({
        kind: 'MINE',
        cellIndex: 0,
        status: 'FINISHED'
      })
    )
    expect(isMinesFinished(state)).toBe(true)
    expect(isMinesBust(state)).toBe(true)
    expect(cashOutPayout(state).kind).toBe('IGNORED')
  })

  it('cashes out after at least one safe reveal', () => {
    const state = start()
    revealCell(state, 2)
    const cash = cashOutPayout(state)
    expect(cash.kind).toBe('OK')
    if (cash.kind !== 'OK') return
    expect(cash.payout).toBeCloseTo(100 * cash.multiplier, 10)
    expect(cash.status).toBe('FINISHED')
    expect(isMinesFinished(state)).toBe(true)
  })

  it('ignores cash out with zero reveals', () => {
    const state = start()
    expect(cashOutPayout(state)).toEqual({
      kind: 'IGNORED',
      reason: 'NO_REVEALS'
    })
  })

  it('ignores double reveal and invalid index', () => {
    const state = start()
    revealCell(state, 2)
    expect(revealCell(state, 2)).toEqual({
      kind: 'IGNORED',
      reason: 'ALREADY_REVEALED'
    })
    expect(revealCell(state, -1)).toEqual({
      kind: 'IGNORED',
      reason: 'INVALID_INDEX'
    })
    expect(revealCell(state, 20)).toEqual({
      kind: 'IGNORED',
      reason: 'INVALID_INDEX'
    })
  })

  it('guards finished games', () => {
    const state = start()
    revealCell(state, 0)
    expect(revealCell(state, 2)).toEqual({
      kind: 'IGNORED',
      reason: 'FINISHED'
    })
    expect(cashOutPayout(state)).toEqual({
      kind: 'IGNORED',
      reason: 'FINISHED'
    })
  })

  it('auto cash-outs idle games with reveals, else forfeits', () => {
    const withReveal = start()
    revealCell(withReveal, 2)
    const cashed = resolveIdleMines(withReveal)
    expect(cashed.forfeited).toBe(false)
    expect(cashed.payout).toBeGreaterThan(0)

    const fresh = start()
    const forfeited = resolveIdleMines(fresh)
    expect(forfeited).toEqual({
      payout: 0,
      multiplier: 0,
      forfeited: true
    })
    expect(isMinesFinished(fresh)).toBe(true)
  })

  it('places mines via RNG when indices are omitted', () => {
    const state = createMinesEngine({
      betAmount: 50,
      mineCount: 3,
      houseEdgeSnapshot: houseEdge,
      random01: () => 0.42
    })
    expect(state.mineIndices).toHaveLength(3)
  })

  it('defaults to Math.random when placing mines', () => {
    const state = createMinesEngine({
      betAmount: 50,
      mineCount: 2,
      houseEdgeSnapshot: houseEdge
    })
    expect(state.mineIndices).toHaveLength(2)
  })

  it('forfeits already-finished idle games', () => {
    const state = start()
    revealCell(state, 0)
    expect(resolveIdleMines(state)).toEqual({
      payout: 0,
      multiplier: 0,
      forfeited: true
    })
  })

  it('round-trips docToMinesEngine', () => {
    const state = start()
    revealCell(state, 2)
    const again = docToMinesEngine(state)
    expect(again).toEqual(state)
    expect(again.revealedIndices).not.toBe(state.revealedIndices)
  })

  it('marks board cleared when all safe cells are revealed', () => {
    const state = createMinesEngine({
      betAmount: 10,
      mineCount: 19,
      houseEdgeSnapshot: houseEdge,
      mineIndices: Array.from({ length: 19 }, (_, i) => i)
    })
    const result = revealCell(state, 19)
    expect(result.kind).toBe('SAFE')
    if (result.kind !== 'SAFE') return
    expect(result.boardCleared).toBe(true)
    const cash = cashOutPayout(state)
    expect(cash.kind).toBe('OK')
  })
})
