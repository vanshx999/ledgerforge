import { describe, expect, it } from 'vitest'
import { DEMO_EMAIL, DEMO_PASSWORD, googleSignInAvailable, hasDemoSession, isDemoCredential, parseGoogleCredential } from './auth'

const credential = (payload: object) => `header.${btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')}.signature`

describe('local demo authentication', () => {
  it('hides the optional Google path until a client id is configured', () => {
    expect(googleSignInAvailable()).toBe(false)
    expect(googleSignInAvailable('   ')).toBe(false)
    expect(googleSignInAvailable('demo-client.apps.googleusercontent.com')).toBe(true)
  })

  it('accepts only the documented local demo credential', () => {
    expect(isDemoCredential(DEMO_EMAIL, DEMO_PASSWORD)).toBe(true)
    expect(isDemoCredential(' CFO@ORBITSYSTEMS.DEMO ', DEMO_PASSWORD)).toBe(true)
    expect(isDemoCredential(DEMO_EMAIL, 'wrong')).toBe(false)
  })

  it('recognizes only an explicit local authenticated session', () => {
    expect(hasDemoSession({ getItem: () => 'authenticated' })).toBe(true)
    expect(hasDemoSession({ getItem: () => null })).toBe(false)
  })

  it('accepts only a current Google credential for the configured client audience', () => {
    const clientId = 'demo-client.apps.googleusercontent.com'
    const token = credential({ aud: clientId, email: 'cfo@example.com', email_verified: true, exp: 2_000_000_000, name: 'CFO' })
    expect(parseGoogleCredential(token, clientId, 1_900_000_000)).toMatchObject({ kind: 'google', email: 'cfo@example.com' })
    expect(parseGoogleCredential(token, 'another-client', 1_900_000_000)).toBeNull()
    expect(parseGoogleCredential(credential({ aud: clientId, email: 'cfo@example.com', email_verified: true, exp: 1 }), clientId, 2)).toBeNull()
  })
})
