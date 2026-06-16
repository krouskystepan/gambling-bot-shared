import { DateTime } from 'luxon'

import type { TPredictionOption } from '../types/prediction'
import { parsePredictionAutolock } from './parsePredictionAutolock'
import { parsePredictionChoices } from './parsePredictionChoices'

export type PredictionChoiceInput =
  | string
  | Pick<TPredictionOption, 'choiceName' | 'odds'>[]

export function normalizePredictionChoices(
  input: PredictionChoiceInput
): ReturnType<typeof parsePredictionChoices> {
  if (typeof input === 'string') {
    return parsePredictionChoices(input)
  }

  if (input.length < 2 || input.length > 3) {
    return { ok: false, error: 'INVALID_COUNT' }
  }

  for (const choice of input) {
    if (
      !choice.choiceName?.trim() ||
      typeof choice.odds !== 'number' ||
      Number.isNaN(choice.odds) ||
      choice.odds <= 0
    ) {
      return {
        ok: false,
        error: 'INVALID_FORMAT',
        detail: choice.choiceName
      }
    }
  }

  return {
    ok: true,
    choices: input.map((choice) => ({
      choiceName: choice.choiceName.trim(),
      odds: choice.odds,
      bets: []
    }))
  }
}

export function normalizePredictionAutolock(
  input: string,
  format: 'iso' | 'discord'
): ReturnType<typeof parsePredictionAutolock> {
  if (format === 'discord') {
    return parsePredictionAutolock(input)
  }

  const trimmed = input.trim()
  if (!trimmed) {
    return { ok: false, error: 'INVALID_FORMAT' }
  }

  const parsed = DateTime.fromISO(trimmed, { zone: 'utc' })
  if (!parsed.isValid) {
    return { ok: false, error: 'INVALID_DATE' }
  }

  const autolock = parsed.toJSDate()
  if (autolock.getTime() <= Date.now()) {
    return { ok: false, error: 'PAST_DATE' }
  }

  return { ok: true, autolock }
}
