import { describe, expect, it } from 'vitest'

import { DEV_GUILDS, hasDevAccess } from '../../src/dev/devAccess'

describe('hasDevAccess', () => {
  it('allows members of dev guilds', () => {
    expect(hasDevAccess('any-user', DEV_GUILDS[0])).toBe(true)
  })

  it('denies regular users outside dev guilds', () => {
    expect(hasDevAccess('regular-user', 'other-guild')).toBe(false)
    expect(hasDevAccess('regular-user', null)).toBe(false)
  })
})
