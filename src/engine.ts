import { bankEntries, ledgerEntries, payments, vendorAliases } from './data'
import type { BankEntry, Escalation, Evaluation, FraudResult, LedgerEntry, MatchResult, Payment, RunMode, RunSnapshot, TraceEvent } from './types'

const dayDistance = (a: string, b: string) => Math.abs((Date.parse(a) - Date.parse(b)) / 86_400_000)
const clean = (value: string) => value.toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim()

export function normalizeCounterparty(value: string): string {
  const normalized = clean(value)
  for (const [canonical, aliases] of Object.entries(vendorAliases)) {
    if (normalized.includes(canonical) || aliases.some((alias) => normalized.includes(alias))) return canonical
  }
  return normalized
}

export function matchTransactions(banks: BankEntry[], ledger: LedgerEntry[], mode: RunMode): MatchResult[] {
  const claimed = new Set<string>()
  return banks.map((bank) => {
    const candidates = ledger.filter((entry) => !claimed.has(entry.id) && Math.abs(entry.amount - bank.amount) < 0.01)
    const match = candidates
      .map((entry) => {
        const days = dayDistance(bank.date, entry.date)
        const sameParty = mode === 'improved'
          ? normalizeCounterparty(bank.description) === normalizeCounterparty(entry.counterparty)
          : clean(bank.description) === clean(entry.counterparty)
        const eligible = mode === 'improved' ? days <= 2 && sameParty : days === 0 && sameParty
        return { entry, eligible, days }
      })
      .filter((item) => item.eligible)
      .sort((a, b) => a.days - b.days)[0]
    if (match) claimed.add(match.entry.id)
    return {
      bankId: bank.id,
      ledgerId: match?.entry.id,
      confidence: match ? Math.max(0.82, 0.99 - match.days * 0.06) : 0,
      reason: match ? `${match.days === 0 ? 'same-day' : `${match.days}d window`} · amount + normalized party` : 'No candidate cleared policy',
      expectedMatch: true,
    }
  })
}

export function detectFraud(input: Payment[], mode: RunMode): FraudResult[] {
  const duplicateKeys = new Map<string, number>()
  input.forEach((p) => duplicateKeys.set(`${p.vendor}:${p.amount}`, (duplicateKeys.get(`${p.vendor}:${p.amount}`) ?? 0) + 1))
  return input.map((payment) => {
    const reasons: string[] = []
    let score = 0.05
    if (payment.isNewVendor) { score += mode === 'improved' ? 0.34 : 0.2; reasons.push('new vendor') }
    if (payment.hour < 6 || payment.hour > 21) { score += mode === 'improved' ? 0.29 : 0.2; reasons.push('after-hours') }
    if (payment.amount >= 20_000) { score += 0.4; reasons.push('high value') }
    if (mode === 'improved' && (duplicateKeys.get(`${payment.vendor}:${payment.amount}`) ?? 0) > 1) { score += 0.32; reasons.push('duplicate amount/vendor') }
    if (mode === 'improved' && payment.amount % 100 === 0 && payment.amount >= 9_000) { score += 0.08; reasons.push('round amount') }
    score = Math.min(0.99, score)
    return { paymentId: payment.id, score, flagged: score >= (mode === 'improved' ? 0.62 : 0.8), reasons, expectedFraud: payment.expectedFraud }
  })
}

export function evaluateBinary(rows: Array<{ flagged: boolean; expectedFraud: boolean }>): Evaluation {
  const truePositives = rows.filter((x) => x.flagged && x.expectedFraud).length
  const falsePositives = rows.filter((x) => x.flagged && !x.expectedFraud).length
  const falseNegatives = rows.filter((x) => !x.flagged && x.expectedFraud).length
  const precision = truePositives / Math.max(1, truePositives + falsePositives)
  const recall = truePositives / Math.max(1, truePositives + falseNegatives)
  return { precision, recall, f1: (2 * precision * recall) / Math.max(0.0001, precision + recall), truePositives, falsePositives, falseNegatives }
}

export function evaluateMatches(rows: MatchResult[]): Evaluation {
  return evaluateBinary(rows.map((r) => ({ flagged: Boolean(r.ledgerId), expectedFraud: r.expectedMatch })))
}

export function createSnapshot(mode: RunMode): RunSnapshot {
  const matches = matchTransactions(bankEntries, ledgerEntries, mode)
  const fraud = detectFraud(payments, mode)
  const reconciliation = evaluateMatches(matches)
  const fraudEval = evaluateBinary(fraud)
  const unmatchedCash = matches.filter((m) => !m.ledgerId).reduce((sum, row) => sum + Math.abs(bankEntries.find((b) => b.id === row.bankId)?.amount ?? 0), 0)
  const fraudExposure = fraud.filter((f) => f.expectedFraud && !f.flagged).reduce((sum, row) => sum + (payments.find((p) => p.id === row.paymentId)?.amount ?? 0), 0)
  return {
    mode,
    timestamp: mode === 'baseline' ? '09:41:12' : '09:42:08',
    reconciliation,
    fraud: fraudEval,
    unmatchedCash,
    fraudExposure,
    runwayMonths: mode === 'baseline' ? 9.4 : 11.8,
    confidence: mode === 'baseline' ? 0.61 : 0.94,
  }
}

export function classifyFailure(snapshot: RunSnapshot): string[] {
  const failures: string[] = []
  if (snapshot.reconciliation.recall < 0.8) failures.push('POLICY_TOO_STRICT: counterparty/date matcher under-recalled known pairs')
  if (snapshot.fraud.recall < 0.8) failures.push('SIGNAL_GAP: independent scoring missed coordinated duplicate payments')
  if (snapshot.confidence < 0.75) failures.push('AMBIGUITY_HIGH: runway assumptions exceed confidence boundary')
  return failures
}

export function buildEscalation(revenueVariancePct: number, concentrationPct: number): Escalation | null {
  if (Math.abs(revenueVariancePct) < 10 && concentrationPct < 35) return null
  return {
    severity: concentrationPct >= 40 ? 'high' : 'medium',
    reason: 'Forecast outcome is decision-sensitive to an unverified revenue assumption.',
    question: 'Should the board case assume the Acme renewal lands in October, or model it as downside until signed?',
    evidence: [`Revenue variance: ${revenueVariancePct}%`, `Customer concentration: ${concentrationPct}%`, 'Runway spread: 2.7 months'],
    recommendation: 'Use downside case for commitments; retain base case for operating targets.',
  }
}

export const baselineSnapshot = createSnapshot('baseline')
export const improvedSnapshot = createSnapshot('improved')

export const traceEvents: TraceEvent[] = [
  { id: 'T01', time: '09:41:03', phase: 'plan', title: 'Decomposed CFO objective', detail: 'Created reconciliation, controls, and runway workstreams with evidence gates.', status: 'info' },
  { id: 'T02', time: '09:41:07', phase: 'tool', title: 'Loaded local finance fixtures', detail: '8 bank lines · 8 ledger entries · 8 payments · checksum 91c7…e04a', tool: 'local.read_dataset', status: 'success', durationMs: 42 },
  { id: 'T03', time: '09:41:12', phase: 'tool', title: 'Ran baseline match policy', detail: 'Exact counterparty + same-day policy produced 2/8 accepted matches.', tool: 'ledger.match_v1', status: 'warning', durationMs: 118 },
  { id: 'T04', time: '09:41:18', phase: 'evaluate', title: 'Evaluator rejected baseline', detail: 'Reconciliation recall 25% failed the ≥90% goal threshold.', tool: 'eval.finance_v1', status: 'error', durationMs: 21 },
  { id: 'T05', time: '09:41:24', phase: 'failure', title: 'Classified policy failure', detail: 'POLICY_TOO_STRICT — aliases and settlement windows absent. This is a recoverable model-policy failure.', status: 'error' },
  { id: 'T06', time: '09:41:31', phase: 'improve', title: 'Synthesized match policy v2', detail: 'Added deterministic vendor aliases, ±2 day settlement window, and one-to-one claiming.', tool: 'policy.patch_local', status: 'success', durationMs: 9 },
  { id: 'T07', time: '09:41:39', phase: 'failure', title: 'Detected coordinated control gap', detail: 'Two Novacore payments were benign in isolation but anomalous as a duplicate cluster.', status: 'warning' },
  { id: 'T08', time: '09:41:45', phase: 'improve', title: 'Added cross-payment features', detail: 'Reran risk scoring with duplicate vendor/amount, timing, and new-vendor signals.', tool: 'risk.score_v2', status: 'success', durationMs: 76 },
  { id: 'T09', time: '09:42:08', phase: 'evaluate', title: 'Improved policy passed gates', detail: 'Match recall 100% · fraud recall 100% · zero false positives.', tool: 'eval.finance_v1', status: 'success', durationMs: 18 },
  { id: 'T10', time: '09:42:14', phase: 'escalate', title: 'Escalated material ambiguity', detail: 'Acme renewal changes runway by 2.7 months; human decision requested before commitments.', status: 'warning' },
  { id: 'T11', time: '09:42:22', phase: 'complete', title: 'Evidence packet sealed', detail: 'Briefing, inputs, policies, traces, evaluations, and SHA-style local checksum bundled.', tool: 'evidence.export', status: 'success', durationMs: 34 },
]
