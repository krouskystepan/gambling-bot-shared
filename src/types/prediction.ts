export type TPredictionOption = {
  choiceName: string
  odds: number
  bets: {
    userId: string
    amount: number
    betId: string
  }[]
}

export type TPrediction = {
  predictionId: string
  guildId: string
  channelId: string
  creatorId: string
  title: string
  choices: TPredictionOption[]
  status: 'active' | 'ended' | 'paying' | 'paid' | 'canceled'
  autolock?: Date | null
  createdAt: Date
  updatedAt: Date
}
