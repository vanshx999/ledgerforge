import { describe, expect, it } from 'vitest'
import { bankEntries, ledgerEntries, payments } from './data'
import {
  baselineSnapshot, buildEscalation, classifyFailure, detectFraud, evaluateBinary,
  improvedSnapshot, matchTransactions, normalizeCounterparty,
} from './engine'

describe('LedgerForge reconciliation matcher', () => {
  it('normalizes deterministic aliases and settlement windows', () => {
    expect(normalizeCounterparty('AWS EMEA CLOUD')).toBe('amazon web services')
    expect(matchTransactions(bankEntries, ledgerEntries, 'baseline').filter(x => x.ledgerId)).toHaveLength(2)
    expect(matchTransactions(bankEntries, ledgerEntries, 'improved').filter(x => x.ledgerId)).toHaveLength(8)
  })
})

describe('LedgerForge fraud controls', () => {
  it('catches the coordinated duplicate cluster after improvement', () => {
    const before = detectFraud(payments, 'baseline')
    const after = detectFraud(payments, 'improved')
    expect(before.filter(x => x.flagged)).toHaveLength(1)
    expect(after.filter(x => x.flagged && x.expectedFraud)).toHaveLength(3)
    expect(after.filter(x => x.flagged && !x.expectedFraud)).toHaveLength(0)
    expect(after.find(x => x.paymentId === 'P-2204')?.reasons).toContain('duplicate amount/vendor')
  })
})

describe('evaluation and measured self-improvement', () => {
  it('reports precision/recall and verifies v2 is strictly better', () => {
    const result = evaluateBinary([
      { flagged: true, expectedFraud: true },
      { flagged: true, expectedFraud: false },
      { flagged: false, expectedFraud: true },
    ])
    expect(result).toMatchObject({ truePositives: 1, falsePositives: 1, falseNegatives: 1 })
    expect(result.precision).toBeCloseTo(0.5)
    expect(improvedSnapshot.reconciliation.recall).toBeGreaterThan(baselineSnapshot.reconciliation.recall)
    expect(improvedSnapshot.fraud.recall).toBeGreaterThan(baselineSnapshot.fraud.recall)
    expect(improvedSnapshot.confidence).toBeGreaterThan(baselineSnapshot.confidence)
  })

  it('classifies deliberate baseline failures', () => {
    expect(classifyFailure(baselineSnapshot)).toEqual(expect.arrayContaining([
      expect.stringContaining('POLICY_TOO_STRICT'),
      expect.stringContaining('SIGNAL_GAP'),
      expect.stringContaining('AMBIGUITY_HIGH'),
    ]))
  })
})

describe('ambiguity escalation', () => {
  it('escalates material assumptions and stays quiet when immaterial', () => {
    const escalation = buildEscalation(-14, 42)
    expect(escalation?.severity).toBe('high')
    expect(escalation?.question).toContain('Acme renewal')
    expect(buildEscalation(3, 22)).toBeNull()
  })
})
