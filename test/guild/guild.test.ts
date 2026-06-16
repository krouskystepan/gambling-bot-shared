import {
  defaultGlobalSettings,
  getCurrencyPlacement,
  getCurrencySymbol,
  globalSettingsFormSchema,
  guildCalendarRangeToUtc,
  isCommonTimezone,
  isGlobalFeatureDisabled,
  normalizeGlobalSettings,
  resolveGuildTimezone
} from 'gambling-bot-shared/guild'
import type { TGuildConfiguration } from 'gambling-bot-shared/guild'
import { describe, expect, it } from 'vitest'

const baseConfig = (globalSettings?: TGuildConfiguration['globalSettings']) =>
  ({
    guildId: 'g1',
    atmChannelIds: { actions: '', logs: '' },
    casinoChannelIds: [],
    winAnnouncementsChannelId: '',
    predictionChannelIds: { actions: '', logs: '' },
    raffleChannelIds: { actions: '', logs: '' },
    managerRoleId: '',
    casinoSettings: {} as TGuildConfiguration['casinoSettings'],
    vipSettings: {
      roleOwnerId: '',
      roleMemberId: '',
      categoryId: '',
      pricePerDay: 0,
      pricePerCreate: 0,
      pricePerAdditionalMember: 0,
      maxMembers: 2
    },
    bonusSettings: {
      rewardMode: 'linear',
      baseReward: 0,
      maxReward: 0,
      resetOnMax: false,
      milestoneBonus: { weekly: 0, monthly: 0 }
    },
    globalSettings
  }) as TGuildConfiguration

describe('normalizeGlobalSettings', () => {
  it('returns defaults and clamps invalid fields', () => {
    expect(normalizeGlobalSettings(undefined)).toEqual(defaultGlobalSettings)
    expect(
      normalizeGlobalSettings({
        timezone: 'Invalid/Zone',
        currencySymbol: ''
      })
    ).toMatchObject({
      timezone: 'UTC',
      currencySymbol: '$'
    })
    expect(
      normalizeGlobalSettings({
        timezone: 'Europe/Prague',
        currencySymbol: 'Kč',
        currencyPlacement: 'suffix'
      })
    ).toMatchObject({
      timezone: 'Europe/Prague',
      currencySymbol: 'Kč',
      currencyPlacement: 'suffix'
    })
  })

  it('coerces string booleans', () => {
    expect(
      normalizeGlobalSettings({
        disableDeposits: 'true' as unknown as boolean,
        disableWithdrawals: 'false' as unknown as boolean
      })
    ).toMatchObject({
      disableDeposits: true,
      disableWithdrawals: false
    })
    expect(
      normalizeGlobalSettings({
        disableDeposits: 1 as unknown as boolean
      }).disableDeposits
    ).toBe(defaultGlobalSettings.disableDeposits)
    expect(
      normalizeGlobalSettings({ disableDeposits: true }).disableDeposits
    ).toBe(true)
    expect(
      normalizeGlobalSettings({ disableDeposits: false }).disableDeposits
    ).toBe(false)
  })

  it('truncates long currency symbols', () => {
    expect(
      normalizeGlobalSettings({ currencySymbol: 'ABCDEFGHIJK' }).currencySymbol
    ).toBe('ABCDEFGH')
  })
})

describe('isCommonTimezone', () => {
  it('recognizes curated zones', () => {
    expect(isCommonTimezone('UTC')).toBe(true)
    expect(isCommonTimezone('Not/AZone')).toBe(false)
  })
})

describe('isGlobalFeatureDisabled', () => {
  it('returns false when config is missing', () => {
    expect(isGlobalFeatureDisabled(null, 'deposit')).toBe(false)
    expect(isGlobalFeatureDisabled({} as TGuildConfiguration, 'deposit')).toBe(
      false
    )
  })

  it('maps each disable flag', () => {
    const config = baseConfig({
      ...defaultGlobalSettings,
      disableRegistrations: true,
      disableDeposits: true,
      disableWithdrawals: true,
      disableCasinoGames: true,
      disableCasinoGamesForMods: true,
      disablePredictions: true,
      disablePredictionManagement: true,
      disableRaffles: true,
      disableRaffleManagement: true,
      disableDailyBonus: true,
      disableVip: true,
      maintenanceMode: true
    })

    expect(isGlobalFeatureDisabled(config, 'registration')).toBe(true)
    expect(isGlobalFeatureDisabled(config, 'deposit')).toBe(true)
    expect(isGlobalFeatureDisabled(config, 'withdraw')).toBe(true)
    expect(isGlobalFeatureDisabled(config, 'casinoGames')).toBe(true)
    expect(isGlobalFeatureDisabled(config, 'casinoGamesForMods')).toBe(true)
    expect(isGlobalFeatureDisabled(config, 'predictions')).toBe(true)
    expect(isGlobalFeatureDisabled(config, 'predictionManagement')).toBe(true)
    expect(isGlobalFeatureDisabled(config, 'raffles')).toBe(true)
    expect(isGlobalFeatureDisabled(config, 'raffleManagement')).toBe(true)
    expect(isGlobalFeatureDisabled(config, 'dailyBonus')).toBe(true)
    expect(isGlobalFeatureDisabled(config, 'vip')).toBe(true)
    expect(isGlobalFeatureDisabled(config, 'maintenance')).toBe(true)
  })

  it('handles unknown feature keys at runtime', () => {
    const config = baseConfig(defaultGlobalSettings)
    expect(isGlobalFeatureDisabled(config, 'unknown' as never)).toBe('unknown')
  })
})

describe('currency helpers', () => {
  it('resolves placement and symbol', () => {
    expect(getCurrencyPlacement({ currencyPlacement: 'suffix' })).toBe('suffix')
    expect(getCurrencyPlacement(null)).toBe('prefix')
    expect(getCurrencySymbol(null)).toBe(defaultGlobalSettings.currencySymbol)
    expect(getCurrencySymbol({ currencySymbol: '€' })).toBe('€')
    expect(getCurrencySymbol({ currencySymbol: '   ' })).toBe(
      defaultGlobalSettings.currencySymbol
    )
  })
})

describe('guild timezone helpers', () => {
  it('resolves timezone with fallback', () => {
    expect(resolveGuildTimezone(null)).toBe(defaultGlobalSettings.timezone)
    expect(resolveGuildTimezone('Europe/Prague')).toBe('Europe/Prague')
    expect(resolveGuildTimezone('  ')).toBe(defaultGlobalSettings.timezone)
  })

  it('converts calendar range to UTC bounds', () => {
    const { start, end } = guildCalendarRangeToUtc(
      '2026-06-01',
      '2026-06-02',
      'UTC'
    )
    expect(start.toISOString()).toBe('2026-06-01T00:00:00.000Z')
    expect(end.getUTCDate()).toBe(2)
  })

  it('falls back to local dates for invalid input', () => {
    const { start, end } = guildCalendarRangeToUtc('bad', 'dates', 'UTC')
    expect(start).toBeInstanceOf(Date)
    expect(end).toBeInstanceOf(Date)
  })
})

describe('globalSettingsFormSchema', () => {
  it('accepts default global settings', () => {
    const result = globalSettingsFormSchema.safeParse(defaultGlobalSettings)
    expect(result.success).toBe(true)
  })
})
