import { describe, expect, it } from 'vitest'
import { demoSession } from './auth'
import { appendHistory, getHistory } from './history'

const memoryStorage = () => { const map = new Map<string, string>(); return { getItem: (key: string) => map.get(key) ?? null, setItem: (key: string, value: string) => map.set(key, value) } }
describe('account-specific CFO history', () => {
  it('seeds records only for the demo account', () => { const storage = memoryStorage(); expect(getHistory(storage, demoSession())).toHaveLength(3); expect(getHistory(storage, { kind: 'google', email: 'new@example.com', name: 'New' })).toEqual([]) })
  it('persists completed and injected review records', () => { const storage = memoryStorage(); const session = demoSession(); const history = appendHistory(storage, session, { id: 'LF-test', date: 'Today', title: 'Injected payment review', score: 94, status: 'attention', evidence: 'Review activity saved', activity: 'New risk escalated' }); expect(history[0].id).toBe('LF-test'); expect(getHistory(storage, session)[0].activity).toBe('New risk escalated') })
})
