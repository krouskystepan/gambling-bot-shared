import type { CasinoBetService } from '../../casino/services/casinoBet.service'
import type { RaffleDb } from './raffle.db'
import type { CancelRaffleResult } from './types'

type RaffleLifecycleDeps = {
  raffleDb: RaffleDb
  casinoBet: Pick<CasinoBetService, 'refundRafflePurchase'>
}

export function createRaffleLifecycleService({
  raffleDb,
  casinoBet
}: RaffleLifecycleDeps) {
  const { cancelRaffleAtomic } = raffleDb
  const { refundRafflePurchase } = casinoBet

  const cancelRaffle = async ({
    raffleId,
    guildId
  }: {
    raffleId: string
    guildId: string
  }): Promise<CancelRaffleResult> => {
    const raffle = await cancelRaffleAtomic({ raffleId, guildId })
    if (!raffle) return { ok: false, code: 'NOT_FOUND' }

    const refundErrors: string[] = []

    for (const entry of raffle.participants) {
      const refundAmount = entry.tickets * raffle.ticketPrice
      if (refundAmount <= 0) continue

      try {
        await refundRafflePurchase({
          userId: entry.userId,
          guildId,
          amount: refundAmount,
          raffleId: raffle.drawId,
          game: 'raffle'
        })
      } catch {
        refundErrors.push(entry.userId)
      }
    }

    return { ok: true, raffle, refundErrors }
  }

  return {
    cancelRaffle
  }
}

export type RaffleLifecycleService = ReturnType<
  typeof createRaffleLifecycleService
>
