import {
  BONUS_MAX_AMOUNT,
  BONUS_MAX_STREAK_MULTIPLIER,
  PREVIEW_DAYS,
  bonusFormSchema,
  calculateBonusReward,
  canClaimDailyBonus,
  generateBonusPreview,
  getBonusCycleLength,
  getEffectiveStreak,
  getStreakAfterClaim,
  getStreakDisplay,
  normalizeBonusSettings,
  parseBonusAmountInput,
  parseBonusMultiplierInput
} from 'gambling-bot-shared/bonus'
import { describe, expect, it } from 'vitest'

const linearSettings = {
  rewardMode: 'linear' as const,
  baseReward: 100,
  streakIncrement: 50,
  maxReward: 0,
  resetOnMax: false,
  milestoneBonus: { weekly: 0, monthly: 0 }
}

describe('getBonusCycleLength', () => {
  it('computes linear and exponential cycle lengths', () => {
    expect(getBonusCycleLength('linear', 100, 300, 100, 1)).toBe(3)
    expect(getBonusCycleLength('linear', 100, 300, 0, 1)).toBe(1)
    expect(getBonusCycleLength('exponential', 100, 800, 0, 2)).toBe(4)
    expect(getBonusCycleLength('exponential', 100, 800, 0, 1)).toBe(1)
  })
})

describe('calculateBonusReward', () => {
  it('uses linear and exponential modes', () => {
    expect(
      calculateBonusReward({ streak: 3, settings: linearSettings }).reward
    ).toBe(200)

    expect(
      calculateBonusReward({
        streak: 3,
        settings: {
          ...linearSettings,
          rewardMode: 'exponential',
          streakMultiplier: 2,
          streakIncrement: undefined
        }
      }).reward
    ).toBe(400)
  })

  it('caps reward and adds milestones', () => {
    expect(
      calculateBonusReward({
        streak: 10,
        settings: { ...linearSettings, maxReward: 500, streakIncrement: 100 }
      }).reward
    ).toBe(500)

    expect(
      calculateBonusReward({
        streak: 7,
        settings: {
          ...linearSettings,
          streakIncrement: 0,
          milestoneBonus: { weekly: 250, monthly: 0 }
        }
      }).reward
    ).toBe(350)

    expect(
      calculateBonusReward({
        streak: 28,
        settings: {
          ...linearSettings,
          streakIncrement: 0,
          milestoneBonus: { weekly: 0, monthly: 1000 }
        }
      }).reward
    ).toBe(1100)
  })

  it('resets streak when maxReward exceeded with resetOnMax', () => {
    expect(
      calculateBonusReward({
        streak: 5,
        settings: {
          ...linearSettings,
          streakIncrement: 100,
          maxReward: 300,
          resetOnMax: true
        }
      }).reward
    ).toBe(200)

    expect(
      calculateBonusReward({
        streak: 6,
        settings: {
          rewardMode: 'exponential',
          baseReward: 100,
          streakMultiplier: 2,
          maxReward: 500,
          resetOnMax: true,
          milestoneBonus: { weekly: 0, monthly: 0 }
        }
      }).reward
    ).toBe(400)
  })

  it('marks isReset only on cycle wrap days', () => {
    const settings = {
      rewardMode: 'exponential' as const,
      baseReward: 100,
      streakMultiplier: 1.5,
      maxReward: 2000,
      resetOnMax: true,
      milestoneBonus: { weekly: 0, monthly: 0 }
    }

    expect(calculateBonusReward({ streak: 8, settings }).isReset).toBe(false)
    expect(calculateBonusReward({ streak: 9, settings }).isReset).toBe(true)
    expect(calculateBonusReward({ streak: 10, settings }).isReset).toBe(false)
    expect(calculateBonusReward({ streak: 17, settings }).isReset).toBe(true)
  })
})

describe('bonus streak helpers', () => {
  const now = new Date('2026-05-20T12:00:00Z')

  it('controls claim eligibility', () => {
    expect(canClaimDailyBonus(null, now)).toBe(true)
    expect(canClaimDailyBonus(new Date('2026-05-20T08:00:00Z'), now)).toBe(
      false
    )
    expect(canClaimDailyBonus(new Date('2026-05-19T08:00:00Z'), now)).toBe(true)
  })

  it('tracks streak after claim', () => {
    expect(getStreakAfterClaim(null, now, 9)).toBe(1)
    expect(getStreakAfterClaim(new Date('2026-05-19T14:00:00Z'), now, 4)).toBe(
      5
    )
    expect(getStreakAfterClaim(new Date('2026-05-17T12:00:00Z'), now, 9)).toBe(
      1
    )
  })

  it('formats streak display and effective streak', () => {
    expect(getStreakDisplay(null, now, 0)).toEqual({
      currentStreak: 0,
      nextStreak: 1
    })
    expect(getStreakDisplay(new Date('2026-05-19T14:00:00Z'), now, 4)).toEqual({
      currentStreak: 4,
      nextStreak: 5
    })
    expect(getStreakDisplay(new Date('2026-05-17T12:00:00Z'), now, 8)).toEqual({
      currentStreak: 0,
      nextStreak: 1
    })
    expect(getEffectiveStreak(null, now, 5)).toBe(0)
    expect(getEffectiveStreak(new Date('2026-05-17T12:00:00Z'), now, 8)).toBe(0)
    expect(getEffectiveStreak(new Date('2026-05-19T14:00:00Z'), now, 4)).toBe(4)
  })
})

describe('normalizeBonusSettings', () => {
  it('clamps currency fields and multipliers', () => {
    const normalized = normalizeBonusSettings({
      rewardMode: 'linear',
      baseReward: 99_999_999_999,
      streakIncrement: 50_000_000,
      maxReward: 1_000_000_000,
      resetOnMax: false,
      milestoneBonus: { weekly: 20_000_000, monthly: 30_000_000 }
    })

    expect(normalized.baseReward).toBe(BONUS_MAX_AMOUNT)
    expect(normalized.streakIncrement).toBe(BONUS_MAX_AMOUNT)

    const exponential = normalizeBonusSettings({
      rewardMode: 'exponential',
      baseReward: 100,
      streakMultiplier: 999,
      maxReward: 0,
      resetOnMax: false,
      milestoneBonus: { weekly: 0, monthly: 0 }
    })
    expect(exponential.streakMultiplier).toBe(BONUS_MAX_STREAK_MULTIPLIER)
  })
})

describe('bonus input parsers', () => {
  it('parses amount and multiplier inputs', () => {
    expect(parseBonusAmountInput('1000')).toBe(1000)
    expect(parseBonusAmountInput('2k')).toBe(2000)
    expect(parseBonusAmountInput('4.5k')).toBe(4500)
    expect(parseBonusAmountInput('2M')).toBe(2_000_000)
    expect(parseBonusAmountInput('12abc34')).toBe(0)
    expect(parseBonusAmountInput('')).toBe(0)
    expect(parseBonusAmountInput('not-a-number')).toBe(0)
    expect(parseBonusMultiplierInput('2.5')).toBe(2.5)
    expect(parseBonusMultiplierInput('not-a-number')).toBeUndefined()
  })
})

describe('generateBonusPreview', () => {
  it('builds preview rows for configured days', () => {
    const preview = generateBonusPreview(linearSettings, 3)
    expect(preview).toHaveLength(3)
    expect(preview[0].day).toBe(1)
    expect(preview[2].reward).toBeGreaterThan(0)
    expect(PREVIEW_DAYS).toBe(60)
  })
})

describe('bonusFormSchema', () => {
  it('accepts valid form with string multiplier', () => {
    const result = bonusFormSchema.safeParse({
      rewardMode: 'exponential',
      baseReward: 100,
      streakMultiplier: '2.5',
      maxReward: 0,
      resetOnMax: false,
      milestoneBonus: { weekly: 0, monthly: 0 }
    })
    expect(result.success).toBe(true)
  })

  it('rejects amounts above the cap', () => {
    const result = bonusFormSchema.safeParse({
      rewardMode: 'linear',
      baseReward: BONUS_MAX_AMOUNT + 1,
      streakIncrement: 0,
      maxReward: 0,
      resetOnMax: false,
      milestoneBonus: { weekly: 0, monthly: 0 }
    })

    expect(result.success).toBe(false)
  })
})
