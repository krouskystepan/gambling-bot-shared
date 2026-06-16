/** minMultiplier <= 0 disables announcements for that game */
export const shouldAnnounceByMultiplier = (
  multiplier: number,
  minMultiplier: number
) => minMultiplier > 0 && multiplier >= minMultiplier

export const shouldAnnouncePlinkoBall = (
  multiplier: number,
  plinkoMinMultiplier: number
) => shouldAnnounceByMultiplier(multiplier, plinkoMinMultiplier)

export const shouldAnnounceGoldenJackpotHit = (
  winMultiplier: number,
  goldenJackpotMinMultiplier: number
) => shouldAnnounceByMultiplier(winMultiplier, goldenJackpotMinMultiplier)
