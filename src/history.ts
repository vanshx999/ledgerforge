import type { AuthSession } from './auth'
import { accountKey } from './auth'

export interface CfoHistoryRecord { id: string; date: string; title: string; score: number; status: 'reviewed' | 'attention'; evidence: string; activity: string }
const prefix = 'ledgerforge-cfo-history:'
export const demoHistory: CfoHistoryRecord[] = [
  { id: 'LF-260906-04', date: 'Today · 09:42', title: 'September close review', score: 94, status: 'attention', evidence: 'Board packet ready', activity: 'CFO decision requested' },
  { id: 'LF-260829-03', date: '29 Aug', title: 'August close review', score: 91, status: 'reviewed', evidence: 'Evidence saved', activity: 'Cash reconciled' },
  { id: 'LF-260731-02', date: '31 Jul', title: 'July close review', score: 88, status: 'reviewed', evidence: 'Evidence saved', activity: 'Controls rechecked' },
]
export function historyStorageKey(session: AuthSession): string { return `${prefix}${accountKey(session)}` }
export function getHistory(storage: Pick<Storage, 'getItem' | 'setItem'>, session: AuthSession): CfoHistoryRecord[] {
  const key = historyStorageKey(session); const raw = storage.getItem(key)
  if (raw) { try { const parsed = JSON.parse(raw) as CfoHistoryRecord[]; if (Array.isArray(parsed)) return parsed } catch { /* seed below */ } }
  const seed = session.kind === 'demo' ? demoHistory : []
  storage.setItem(key, JSON.stringify(seed)); return seed
}
export function appendHistory(storage: Pick<Storage, 'getItem' | 'setItem'>, session: AuthSession, record: CfoHistoryRecord): CfoHistoryRecord[] {
  const next = [record, ...getHistory(storage, session)]; storage.setItem(historyStorageKey(session), JSON.stringify(next)); return next
}
