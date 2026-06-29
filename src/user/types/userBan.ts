export type TUserBan = {
  banId: string
  guildId: string
  userId: string
  bannedAt: Date
  bannedBy: string
  banReason?: string
  unbannedAt: Date | null
  unbannedBy: string | null
  unbanReason?: string
  createdAt: Date
  updatedAt: Date
}
