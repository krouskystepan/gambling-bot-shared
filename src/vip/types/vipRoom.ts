export type VipExpiryWarningTier = '24h' | '1h'

export type TVipRoom = {
  ownerId: string
  guildId: string
  channelId: string
  expiresAt: Date
  expiryWarningsSent?: VipExpiryWarningTier[]
  memberIds: string[]
  createdAt: Date
  updatedAt: Date
}
