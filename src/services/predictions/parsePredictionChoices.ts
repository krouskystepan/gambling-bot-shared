import type { TPredictionOption } from '../../types/prediction'

export type ParsePredictionChoicesError = 'INVALID_COUNT' | 'INVALID_FORMAT'

export type ParsePredictionChoicesResult =
  | { ok: true; choices: TPredictionOption[] }
  | { ok: false; error: ParsePredictionChoicesError; detail?: string }

export function parsePredictionChoices(
  input: string
): ParsePredictionChoicesResult {
  const rawChoices = input.split(',').map((c) => c.trim())

  if (rawChoices.length < 2 || rawChoices.length > 3) {
    return { ok: false, error: 'INVALID_COUNT' }
  }

  const choicesArray: TPredictionOption[] = []

  for (const item of rawChoices) {
    const [name, odds] = item.split(':').map((x) => x.trim())
    if (!name || !odds || Number.isNaN(Number(odds))) {
      return {
        ok: false,
        error: 'INVALID_FORMAT',
        detail: item
      }
    }

    choicesArray.push({
      choiceName: name,
      odds: Number(odds),
      bets: []
    })
  }

  return { ok: true, choices: choicesArray }
}
