export type TPredictionOption = {
  choiceName: string
  odds: number
  bets: {
    userId: string
    amount: number
  }[]
}

export type TPrediction = {
  predictionId: string
  guildId: string
  channelId: string
  creatorId: string
  title: string
  choices: TPredictionOption[]
  status: 'active' | 'ended' | 'paid' | 'canceled'
  autolock?: Date | null
  createdAt: Date
  updatedAt: Date
}
