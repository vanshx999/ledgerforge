import { describe, expect, it } from 'vitest'
import { DEFAULT_REVIEW_SETTINGS, clearDemoData, loadReviewSettings, resetReviewSettings, saveReviewSettings } from './settings'

const memoryStorage = () => { const map = new Map<string, string>(); return { getItem: (key: string) => map.get(key) ?? null, setItem: (key: string, value: string) => map.set(key, value), removeItem: (key: string) => map.delete(key), has: (key: string) => map.has(key) } }
describe('demo data and review settings', () => {
  it('persists valid settings and resets to defaults', () => { const storage = memoryStorage(); const custom = { settlementWindowDays: 1, fraudSensitivity: 'high' as const, materialityThreshold: 25000 }; saveReviewSettings(storage, custom); expect(loadReviewSettings(storage)).toEqual(custom); resetReviewSettings(storage); expect(loadReviewSettings(storage)).toEqual(DEFAULT_REVIEW_SETTINGS) })
  it('clears all demo-only stale state predictably', () => { const storage = memoryStorage(); ['ledgerforge-demo-data','ledgerforge-decision','ledgerforge-review-run','ledgerforge-cfo-history:demo:cfo@orbitsystems.demo'].forEach(k => storage.setItem(k, 'stale')); clearDemoData(storage); expect(storage.has('ledgerforge-demo-data')).toBe(false); expect(storage.has('ledgerforge-decision')).toBe(false); expect(storage.has('ledgerforge-review-run')).toBe(false); expect(storage.has('ledgerforge-cfo-history:demo:cfo@orbitsystems.demo')).toBe(false) })
})
