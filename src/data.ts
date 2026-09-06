import type { BankEntry, LedgerEntry, Payment } from './types'

export const bankEntries: BankEntry[] = [
  { id: 'B-1041', date: '2026-08-28', amount: 48250, description: 'STRIPE PAYOUT 8841' },
  { id: 'B-1042', date: '2026-08-29', amount: -12480, description: 'AWS EMEA CLOUD' },
  { id: 'B-1043', date: '2026-08-30', amount: -8750, description: 'NORTHSTAR CONSULT' },
  { id: 'B-1044', date: '2026-08-31', amount: 32100, description: 'ACME INC INV-882' },
  { id: 'B-1045', date: '2026-08-31', amount: -2499.5, description: 'SLACK TECHNOLOGIES' },
  { id: 'B-1046', date: '2026-09-01', amount: -9800, description: 'NOVACORE SYSTEMS' },
  { id: 'B-1047', date: '2026-09-01', amount: 18500, description: 'GLOBEX INV-901' },
  { id: 'B-1048', date: '2026-09-02', amount: -9800, description: 'NOVACORE SYSTEMS' },
]

export const ledgerEntries: LedgerEntry[] = [
  { id: 'L-8801', date: '2026-08-28', amount: 48250, counterparty: 'Stripe', cleared: false },
  { id: 'L-8802', date: '2026-08-29', amount: -12480, counterparty: 'Amazon Web Services', cleared: false },
  { id: 'L-8803', date: '2026-08-30', amount: -8750, counterparty: 'Northstar Consulting', cleared: false },
  { id: 'L-8804', date: '2026-08-30', amount: 32100, counterparty: 'Acme Incorporated', cleared: false },
  { id: 'L-8805', date: '2026-08-31', amount: -2499.5, counterparty: 'Slack', cleared: false },
  { id: 'L-8806', date: '2026-09-01', amount: -9800, counterparty: 'Novacore Systems', cleared: false },
  { id: 'L-8807', date: '2026-09-01', amount: 18500, counterparty: 'Globex', cleared: false },
  { id: 'L-8808', date: '2026-09-02', amount: -9800, counterparty: 'Novacore Systems', cleared: false },
]

export const payments: Payment[] = [
  { id: 'P-2201', date: '2026-08-26', vendor: 'Figma', amount: 720, hour: 11, isNewVendor: false, expectedFraud: false },
  { id: 'P-2202', date: '2026-08-27', vendor: 'Rippling', amount: 68200, hour: 14, isNewVendor: false, expectedFraud: false },
  { id: 'P-2203', date: '2026-08-28', vendor: 'Datadog', amount: 4800, hour: 10, isNewVendor: false, expectedFraud: false },
  { id: 'P-2204', date: '2026-08-31', vendor: 'Novacore Systems', amount: 9800, hour: 2, isNewVendor: true, expectedFraud: true },
  { id: 'P-2205', date: '2026-09-01', vendor: 'Novacore Systems', amount: 9800, hour: 2, isNewVendor: true, expectedFraud: true },
  { id: 'P-2206', date: '2026-09-01', vendor: 'Mercury Office', amount: 1750, hour: 13, isNewVendor: false, expectedFraud: false },
  { id: 'P-2207', date: '2026-09-02', vendor: 'Zentara Advisory', amount: 25000, hour: 23, isNewVendor: true, expectedFraud: true },
  { id: 'P-2208', date: '2026-09-02', vendor: 'Notion', amount: 640, hour: 9, isNewVendor: false, expectedFraud: false },
]

export const monthlyCash = [
  { month: 'Apr', actual: 812, plan: 804 },
  { month: 'May', actual: 774, plan: 768 },
  { month: 'Jun', actual: 721, plan: 730 },
  { month: 'Jul', actual: 682, plan: 690 },
  { month: 'Aug', actual: 636, plan: 648 },
  { month: 'Sep', actual: 598, plan: 607 },
  { month: 'Oct', actual: 559, plan: 566 },
  { month: 'Nov', actual: 520, plan: 525 },
  { month: 'Dec', actual: 478, plan: 484 },
]

export const vendorAliases: Record<string, string[]> = {
  stripe: ['stripe payout'],
  'amazon web services': ['aws', 'aws emea cloud'],
  'northstar consulting': ['northstar consult'],
  'acme incorporated': ['acme inc'],
  slack: ['slack technologies'],
  'novacore systems': ['novacore systems'],
  globex: ['globex'],
}
