/** Random alphabet size for id bodies (0-9 + a-z). */
const ID_RADIX = 36
/** Time slice length in base36 (~28 min uniqueness on time alone). */
const ID_TIME_CHARS = 4
/** Random suffix length (36^4 ≈ 1.7M). Combined with time, collisions are negligible. */
const ID_RANDOM_CHARS = 4

const buildIdBody = (): string => {
  const time = Date.now().toString(ID_RADIX).slice(-ID_TIME_CHARS)
  const random = Math.floor(Math.random() * ID_RADIX ** ID_RANDOM_CHARS)
    .toString(ID_RADIX)
    .padStart(ID_RANDOM_CHARS, '0')
  return `${time}${random}`.toUpperCase()
}

/**
 * Generate a short unique id, optionally prefixed (`slots-A1B2C3D4`).
 * Body is 8 chars (time + random) - shorter than the old timestamp dump, still safe.
 */
export const generateId = (prefix?: string): string => {
  const body = buildIdBody()
  if (!prefix) return body
  return `${prefix}-${body}`
}

/**
 * Ledger reference under a session id (`slots-ABC:1`, `slots-ABC:1:d0`).
 * Keeps Transaction.referenceId searchable by the embed gameId while staying unique per bet.
 */
export const sessionBetId = (
  sessionId: string,
  scope: string | number
): string => `${sessionId}:${scope}`
