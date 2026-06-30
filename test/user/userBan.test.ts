import { describe, expect, it } from 'vitest'

import {
  isUserBanActive,
  normalizeBanReason
} from '../../src/user/utils/userBan'

describe('normalizeBanReason', () => {
  it('trims and accepts valid reasons', () => {
    expect(normalizeBanReason('  abuse  ')).toBe('abuse')
  })

  it('returns undefined for empty reasons', () => {
    expect(normalizeBanReason('   ')).toBeUndefined()
    expect(normalizeBanReason(null)).toBeUndefined()
  })
})

describe('isUserBanActive', () => {
  it('returns true when unbannedAt is null', () => {
    expect(isUserBanActive({ unbannedAt: null })).toBe(true)
  })

  it('returns false when unbannedAt is set', () => {
    expect(isUserBanActive({ unbannedAt: new Date() })).toBe(false)
  })
})
