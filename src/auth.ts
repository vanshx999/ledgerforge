export const DEMO_EMAIL = 'cfo@orbitsystems.demo'
export const DEMO_PASSWORD = 'ledgerforge'
export const SESSION_KEY = 'ledgerforge-demo-session'

export function isDemoCredential(email: string, password: string): boolean {
  return email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD
}

export function hasDemoSession(storage: Pick<Storage, 'getItem'>): boolean {
  return storage.getItem(SESSION_KEY) === 'authenticated'
}
