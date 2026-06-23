/** Discord guild IDs where dev tooling is enabled for all guild members. */
export const DEV_GUILDS = ['1298805664654561340']

/** Discord user IDs allowed to use dev tooling outside dev guilds. */
export const DEV_USERS: string[] = []

export function hasDevAccess(
  userId: string,
  guildId: string | null | undefined
): boolean {
  if (guildId && DEV_GUILDS.includes(guildId)) {
    return true
  }

  return DEV_USERS.includes(userId)
}
