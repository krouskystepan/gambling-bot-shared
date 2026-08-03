export type CasinoSessionStats = {
  roundsPlayed: number
  totalWagered: number
  totalPayout: number
  netProfit: number
}

export const emptySessionStats = (): CasinoSessionStats => ({
  roundsPlayed: 0,
  totalWagered: 0,
  totalPayout: 0,
  netProfit: 0
})

/** Plain snapshot - safe with Mongoose subdocs (spread/getters). */
export const normalizeSessionStats = (
  stats?: Partial<CasinoSessionStats> | null
): CasinoSessionStats => ({
  roundsPlayed: Number(stats?.roundsPlayed ?? 0) || 0,
  totalWagered: Number(stats?.totalWagered ?? 0) || 0,
  totalPayout: Number(stats?.totalPayout ?? 0) || 0,
  netProfit: Number(stats?.netProfit ?? 0) || 0
})

export const bumpSessionStats = (
  stats: CasinoSessionStats,
  {
    totalBet,
    totalPayout,
    rounds = 1
  }: { totalBet: number; totalPayout: number; rounds?: number }
): CasinoSessionStats => {
  const base = normalizeSessionStats(stats)
  return {
    roundsPlayed: base.roundsPlayed + rounds,
    totalWagered: base.totalWagered + totalBet,
    totalPayout: base.totalPayout + totalPayout,
    netProfit: base.netProfit + (totalPayout - totalBet)
  }
}
