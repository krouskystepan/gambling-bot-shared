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

export const bumpSessionStats = (
  stats: CasinoSessionStats,
  {
    totalBet,
    totalPayout,
    rounds = 1
  }: { totalBet: number; totalPayout: number; rounds?: number }
): CasinoSessionStats => ({
  roundsPlayed: stats.roundsPlayed + rounds,
  totalWagered: stats.totalWagered + totalBet,
  totalPayout: stats.totalPayout + totalPayout,
  netProfit: stats.netProfit + (totalPayout - totalBet)
})
