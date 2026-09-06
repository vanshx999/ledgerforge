export type FraudSensitivity = 'low' | 'standard' | 'high'

export interface ReviewSettings {
  settlementWindowDays: number
  fraudSensitivity: FraudSensitivity
  materialityThreshold: number
}

export const SETTINGS_KEY = 'ledgerforge-review-settings'
export const DEFAULT_REVIEW_SETTINGS: ReviewSettings = { settlementWindowDays: 2, fraudSensitivity: 'standard', materialityThreshold: 10000 }

export function loadReviewSettings(storage: Pick<Storage, 'getItem'>): ReviewSettings {
  const raw = storage.getItem(SETTINGS_KEY)
  if (!raw) return DEFAULT_REVIEW_SETTINGS
  try {
    const parsed = JSON.parse(raw) as Partial<ReviewSettings>
    const settlementWindowDays = Number(parsed.settlementWindowDays)
    const materialityThreshold = Number(parsed.materialityThreshold)
    const fraudSensitivity = parsed.fraudSensitivity
    if ([0, 1, 2, 3].includes(settlementWindowDays) && materialityThreshold > 0 && ['low', 'standard', 'high'].includes(fraudSensitivity as string)) return { settlementWindowDays, materialityThreshold, fraudSensitivity: fraudSensitivity as FraudSensitivity }
  } catch { /* invalid local settings use defaults */ }
  return DEFAULT_REVIEW_SETTINGS
}

export function saveReviewSettings(storage: Pick<Storage, 'setItem'>, settings: ReviewSettings): void { storage.setItem(SETTINGS_KEY, JSON.stringify(settings)) }

export function resetReviewSettings(storage: Pick<Storage, 'removeItem'>): void { storage.removeItem(SETTINGS_KEY) }

export function clearDemoData(storage: Pick<Storage, 'removeItem'>): void {
  storage.removeItem('ledgerforge-demo-data')
  storage.removeItem('ledgerforge-decision')
  storage.removeItem('ledgerforge-review-run')
  storage.removeItem('ledgerforge-cfo-history:demo:cfo@orbitsystems.demo')
}
