import { DateTime } from 'luxon'

export type ParsePredictionAutolockError =
  | 'INVALID_FORMAT'
  | 'INVALID_DATE'
  | 'PAST_DATE'

export type ParsePredictionAutolockResult =
  | { ok: true; autolock: Date }
  | { ok: false; error: ParsePredictionAutolockError }

const AUTOLOCK_REGEX = /^(\d{1,2})\.(\d{1,2})\.(\d{4}) (\d{2}):(\d{2})$/

export function parsePredictionAutolock(
  input: string,
  timezone = 'Europe/Prague'
): ParsePredictionAutolockResult {
  const match = input.match(AUTOLOCK_REGEX)

  if (!match) {
    return { ok: false, error: 'INVALID_FORMAT' }
  }

  const [, day, month, year, hour, minute] = match.map(Number)

  const dt = DateTime.fromObject(
    { year, month, day, hour, minute },
    { zone: timezone }
  )

  if (!dt.isValid) {
    return { ok: false, error: 'INVALID_DATE' }
  }

  if (dt.toMillis() <= Date.now()) {
    return { ok: false, error: 'PAST_DATE' }
  }

  return { ok: true, autolock: dt.toJSDate() }
}
