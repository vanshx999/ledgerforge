export const DEMO_EMAIL = 'cfo@orbitsystems.demo'
export const DEMO_PASSWORD = 'ledgerforge'
export const SESSION_KEY = 'ledgerforge-demo-session'

export type AccountKind = 'demo' | 'google'

export interface AuthSession {
  kind: AccountKind
  email: string
  name: string
  picture?: string
}

interface GoogleClaims {
  aud?: string
  email?: string
  email_verified?: boolean
  exp?: number
  name?: string
  picture?: string
}

export function isDemoCredential(email: string, password: string): boolean {
  return email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD
}

/** Google Identity Services is opt-in for the static client; an empty ID means hide the path. */
export function googleSignInAvailable(clientId?: string): boolean { return Boolean(clientId?.trim()) }

export function demoSession(): AuthSession {
  return { kind: 'demo', email: DEMO_EMAIL, name: 'Vansh Mehendr' }
}

export function loadSession(storage: Pick<Storage, 'getItem'>): AuthSession | null {
  const raw = storage.getItem(SESSION_KEY)
  if (!raw) return null
  if (raw === 'authenticated') return demoSession()
  try {
    const value = JSON.parse(raw) as AuthSession
    if ((value.kind === 'demo' || value.kind === 'google') && Boolean(value.email) && Boolean(value.name)) return value
  } catch { /* invalid local data is treated as signed out */ }
  return null
}

export function hasDemoSession(storage: Pick<Storage, 'getItem'>): boolean { return loadSession(storage)?.kind === 'demo' }
export function saveSession(storage: Pick<Storage, 'setItem'>, session: AuthSession): void { storage.setItem(SESSION_KEY, JSON.stringify(session)) }
export function accountKey(session: AuthSession): string { return `${session.kind}:${session.email.trim().toLowerCase()}` }

function decodeBase64Url(value: string): string | null {
  try { return atob(value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=')) } catch { return null }
}

/** Static-client sanity checks. Signature validation requires a backend. */
export function parseGoogleCredential(credential: string, expectedClientId: string, nowSeconds = Math.floor(Date.now() / 1000)): AuthSession | null {
  const payload = credential.split('.')[1]
  if (!expectedClientId || !payload) return null
  const decoded = decodeBase64Url(payload)
  if (!decoded) return null
  try {
    const claims = JSON.parse(decoded) as GoogleClaims
    if (claims.aud !== expectedClientId || !claims.email || claims.email_verified !== true || !claims.exp || claims.exp <= nowSeconds) return null
    return { kind: 'google', email: claims.email, name: claims.name || claims.email.split('@')[0], picture: claims.picture }
  } catch { return null }
}
