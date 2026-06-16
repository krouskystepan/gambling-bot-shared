import { DateTime } from 'luxon'

import { defaultGlobalSettings } from '../constants/defaultGlobalSettings'

export const resolveGuildTimezone = (timezone?: string | null): string => {
  const raw = timezone?.trim()
  return raw && raw.length > 0 ? raw : defaultGlobalSettings.timezone
}

/** Calendar dates (yyyy-MM-dd) interpreted in the guild timezone → UTC bounds for MongoDB. */
export const guildCalendarRangeToUtc = (
  dateFrom: string,
  dateTo: string,
  timezone?: string | null
): { start: Date; end: Date } => {
  const zone = resolveGuildTimezone(timezone)
  const start = DateTime.fromISO(dateFrom, { zone }).startOf('day')
  const end = DateTime.fromISO(dateTo, { zone }).endOf('day')

  if (!start.isValid || !end.isValid) {
    const fallbackStart = new Date(dateFrom)
    fallbackStart.setHours(0, 0, 0, 0)
    const fallbackEnd = new Date(dateTo)
    fallbackEnd.setHours(23, 59, 59, 999)
    return { start: fallbackStart, end: fallbackEnd }
  }

  return { start: start.toUTC().toJSDate(), end: end.toUTC().toJSDate() }
}
