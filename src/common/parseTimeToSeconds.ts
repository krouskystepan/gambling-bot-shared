export const parseTimeToSeconds = (time: string): number => {
  const regex = /(\d+)([mhdw])/gi
  let totalSeconds = 0

  const sanitizedTime = time.replace(/\s+/g, '')
  const matches = sanitizedTime.match(regex)

  if (!matches) return 0

  matches.forEach((match) => {
    const value = parseInt(match.slice(0, -1), 10)
    const unit = match.slice(-1).toLowerCase()

    switch (unit) {
      case 'm':
        totalSeconds += value * 60
        break
      case 'h':
        totalSeconds += value * 3600
        break
      case 'd':
        totalSeconds += value * 86400
        break
      case 'w':
        totalSeconds += value * 604800
        break
    }
  })

  return totalSeconds
}
