import { DateTime } from 'luxon'

import { resolveGuildTimezone } from '../../guild/utils/guildTimezone'

/** Guild calendar date (yyyy-MM-dd) for the given instant. */
export const getQuestDateKey = (
  now: Date,
  timezone?: string | null
): string => {
  const zone = resolveGuildTimezone(timezone)
  const dt = DateTime.fromJSDate(now, { zone: 'utc' }).setZone(zone)
  if (!dt.isValid) {
    return DateTime.fromJSDate(now).toUTC().toFormat('yyyy-MM-dd')
  }
  return dt.toFormat('yyyy-MM-dd')
}

/** Previous guild calendar day for a yyyy-MM-dd key. */
export const getPreviousQuestDateKey = (
  dateKey: string,
  timezone?: string | null
): string => {
  const zone = resolveGuildTimezone(timezone)
  const dt = DateTime.fromISO(dateKey, { zone })
  if (!dt.isValid) {
    return dateKey
  }
  return dt.minus({ days: 1 }).toFormat('yyyy-MM-dd')
}
