import { describe, expect, it } from 'vitest'
import { DEMO_EMAIL, DEMO_PASSWORD, hasDemoSession, isDemoCredential } from './auth'

describe('local demo authentication', () => {
  it('accepts only the documented local demo credential', () => {
    expect(isDemoCredential(DEMO_EMAIL, DEMO_PASSWORD)).toBe(true)
    expect(isDemoCredential(' CFO@ORBITSYSTEMS.DEMO ', DEMO_PASSWORD)).toBe(true)
    expect(isDemoCredential(DEMO_EMAIL, 'wrong')).toBe(false)
  })

  it('recognizes only an explicit local authenticated session', () => {
    expect(hasDemoSession({ getItem: () => 'authenticated' })).toBe(true)
    expect(hasDemoSession({ getItem: () => null })).toBe(false)
  })
})
