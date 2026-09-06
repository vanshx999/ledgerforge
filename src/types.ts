export type RunMode = 'baseline' | 'improved'

export interface BankEntry {
  id: string
  date: string
  amount: number
  description: string
}

export interface LedgerEntry {
  id: string
  date: string
  amount: number
  counterparty: string
  cleared: boolean
}

export interface Payment {
  id: string
  date: string
  vendor: string
  amount: number
  hour: number
  isNewVendor: boolean
  expectedFraud: boolean
}

export interface MatchResult {
  bankId: string
  ledgerId?: string
  confidence: number
  reason: string
  expectedMatch: boolean
}

export interface FraudResult {
  paymentId: string
  score: number
  flagged: boolean
  reasons: string[]
  expectedFraud: boolean
}

export interface Evaluation {
  precision: number
  recall: number
  f1: number
  truePositives: number
  falsePositives: number
  falseNegatives: number
}

export interface TraceEvent {
  id: string
  time: string
  phase: 'plan' | 'tool' | 'evaluate' | 'failure' | 'improve' | 'escalate' | 'complete'
  title: string
  detail: string
  tool?: string
  status: 'success' | 'warning' | 'error' | 'info'
  durationMs?: number
}

export interface Goal {
  id: string
  title: string
  objective: string
  status: 'complete' | 'attention' | 'waiting'
  score: number
}

export interface Escalation {
  severity: 'low' | 'medium' | 'high'
  reason: string
  question: string
  evidence: string[]
  recommendation: string
}

export interface RunSnapshot {
  mode: RunMode
  timestamp: string
  reconciliation: Evaluation
  fraud: Evaluation
  unmatchedCash: number
  fraudExposure: number
  runwayMonths: number
  confidence: number
}
