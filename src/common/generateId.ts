export const generateId = (): string => {
  const timestamp = Date.now().toString(36)
  const random = Math.floor(Math.random() * 1_000_000)
    .toString(36)
    .padStart(5, '0')
  return `${timestamp}${random}`.toUpperCase()
}
