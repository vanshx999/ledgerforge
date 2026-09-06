import { useMemo, useState } from 'react'
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, BookOpen,
  Bot, BrainCircuit, Check, CheckCircle2, ChevronDown, CircleDot, Clock3,
  Database, Download, FileCheck2, FileText, FlaskConical, Gauge, GitCompareArrows,
  HelpCircle, LayoutDashboard, Menu, Play, RefreshCcw, Search, Settings2, ShieldAlert,
  ShieldCheck, Sparkles, Target, TerminalSquare, TrendingDown, WalletCards, X, Zap,
} from 'lucide-react'
import { bankEntries, monthlyCash, payments } from './data'
import {
  baselineSnapshot, buildEscalation, classifyFailure, detectFraud, improvedSnapshot,
  matchTransactions, traceEvents,
} from './engine'
import { ledgerEntries } from './data'
import type { Goal, RunSnapshot, TraceEvent } from './types'

type View = 'overview' | 'timeline' | 'time-machine' | 'evidence'

const goals: Goal[] = [
  { id: 'close', title: 'Close cash position', objective: 'Reconcile ≥ 90% of bank activity with defensible links.', status: 'complete', score: 100 },
  { id: 'controls', title: 'Surface payment risk', objective: 'Find material anomalies with zero avoidable false positives.', status: 'complete', score: 100 },
  { id: 'runway', title: 'Protect operating runway', objective: 'Quantify plan variance and isolate decision-sensitive assumptions.', status: 'attention', score: 92 },
]

const fmtMoney = (value: number, compact = false) => {
  if (compact) return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(value)
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}
const pct = (value: number) => `${Math.round(value * 100)}%`

function Logo() {
  return <div className="brand"><div className="brand-mark"><span>LF</span></div><div><strong>LedgerForge</strong><small>Autonomous finance</small></div></div>
}

function StatusPill({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'green' | 'amber' | 'red' | 'blue' | 'neutral' }) {
  return <span className={`pill ${tone}`}><span className="pill-dot" />{children}</span>
}

function Sidebar({ view, setView, openAbout }: { view: View; setView: (view: View) => void; openAbout: () => void }) {
  const items = [
    { id: 'overview' as View, label: 'Command center', icon: LayoutDashboard },
    { id: 'timeline' as View, label: 'Execution trace', icon: Activity, badge: '11' },
    { id: 'time-machine' as View, label: 'Time Machine', icon: GitCompareArrows },
    { id: 'evidence' as View, label: 'Evidence packet', icon: FileCheck2 },
  ]
  return <aside className="sidebar">
    <Logo />
    <div className="workspace-switch"><div className="workspace-icon">OR</div><div><small>WORKSPACE</small><strong>Orbit Systems</strong></div><ChevronDown size={14} /></div>
    <nav>
      <span className="nav-label">CONTROL ROOM</span>
      {items.map(({ id, label, icon: Icon, badge }) => <button key={id} className={view === id ? 'active' : ''} onClick={() => setView(id)}><Icon size={17} /><span>{label}</span>{badge && <em>{badge}</em>}</button>)}
      <span className="nav-label second">OPERATIONS</span>
      <button><Database size={17} /><span>Data sources</span><i className="connected-dot" /></button>
      <button><Settings2 size={17} /><span>Control policies</span></button>
    </nav>
    <div className="sidebar-bottom">
      <div className="local-banner"><ShieldCheck size={16} /><div><strong>Local-only mode</strong><span>No credentials · no egress</span></div></div>
      <button className="about-link" onClick={openAbout}><HelpCircle size={16} />About LedgerForge</button>
      <div className="profile"><div className="avatar">VM</div><div><strong>Vansh M.</strong><small>CFO workspace owner</small></div><span className="online" /></div>
    </div>
  </aside>
}

function Header({ running, run, reset, mobileNav }: { running: boolean; run: () => void; reset: () => void; mobileNav: () => void }) {
  return <header className="topbar">
    <button className="mobile-menu" onClick={mobileNav}><Menu size={20} /></button>
    <div><div className="eyebrow">SEPTEMBER CLOSE · FY26</div><h1>CFO intelligence console</h1></div>
    <div className="top-actions">
      <div className="data-fresh"><span /><div><small>DATA FRESHNESS</small><strong>Live · 2m ago</strong></div></div>
      <button className="icon-btn" title="Reset demo" onClick={reset}><RefreshCcw size={17} /></button>
      <button className="run-btn" disabled={running} onClick={run}>{running ? <><span className="spinner" />Running evaluation</> : <><Play size={15} fill="currentColor" />Run all goals</>}</button>
    </div>
  </header>
}

function MetricCard({ label, value, delta, positive, icon: Icon, detail }: { label: string; value: string; delta: string; positive?: boolean; icon: React.ElementType; detail: string }) {
  return <article className="metric-card">
    <div className="metric-head"><span>{label}</span><Icon size={17} /></div>
    <strong className="metric-value">{value}</strong>
    <div className={`metric-change ${positive ? 'good' : 'warn'}`}>{positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}<b>{delta}</b><span>{detail}</span></div>
  </article>
}

function CashChart() {
  const max = 850; const min = 430; const width = 680; const height = 182
  const point = (v: number, i: number) => `${24 + (i * (width - 48)) / (monthlyCash.length - 1)},${16 + ((max - v) / (max - min)) * (height - 38)}`
  const actual = monthlyCash.map((d, i) => point(d.actual, i)).join(' ')
  const plan = monthlyCash.map((d, i) => point(d.plan, i)).join(' ')
  const area = `24,${height - 22} ${actual} ${width - 24},${height - 22}`
  return <div className="cash-chart">
    <div className="chart-legend"><span><i className="actual" />Actual / forecast</span><span><i className="plan" />Board plan</span></div>
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Cash runway forecast chart">
      {[40, 78, 116, 154].map((y) => <line key={y} x1="24" x2={width - 24} y1={y} y2={y} className="grid-line" />)}
      <polygon points={area} className="area" />
      <polyline points={plan} className="plan-line" />
      <polyline points={actual} className="actual-line" />
      {monthlyCash.map((d, i) => { const [x, y] = point(d.actual, i).split(','); return <circle key={d.month} cx={x} cy={y} r="3" className="data-point" /> })}
    </svg>
    <div className="x-axis">{monthlyCash.map(d => <span key={d.month}>{d.month}</span>)}</div>
  </div>
}

function GoalRow({ goal }: { goal: Goal }) {
  const Icon = goal.id === 'close' ? WalletCards : goal.id === 'controls' ? ShieldAlert : TrendingDown
  return <div className="goal-row">
    <div className={`goal-icon ${goal.status}`}><Icon size={18} /></div>
    <div className="goal-copy"><div><strong>{goal.title}</strong><StatusPill tone={goal.status === 'complete' ? 'green' : 'amber'}>{goal.status === 'complete' ? 'Goal met' : 'Decision needed'}</StatusPill></div><p>{goal.objective}</p></div>
    <div className="score"><strong>{goal.score}</strong><span>/100</span></div>
  </div>
}

function ImprovementPanel({ baseline, improved, onTimeMachine }: { baseline: RunSnapshot; improved: RunSnapshot; onTimeMachine: () => void }) {
  const changes = [
    { label: 'Reconciliation recall', before: pct(baseline.reconciliation.recall), after: pct(improved.reconciliation.recall), diff: `+${Math.round((improved.reconciliation.recall - baseline.reconciliation.recall) * 100)} pts` },
    { label: 'Fraud detection recall', before: pct(baseline.fraud.recall), after: pct(improved.fraud.recall), diff: `+${Math.round((improved.fraud.recall - baseline.fraud.recall) * 100)} pts` },
    { label: 'Unresolved exposure', before: fmtMoney(baseline.unmatchedCash, true), after: fmtMoney(improved.unmatchedCash, true), diff: `−${fmtMoney(baseline.unmatchedCash, true)}` },
  ]
  return <section className="panel improvement-panel">
    <div className="panel-head"><div><span className="section-kicker"><Sparkles size={13} />SELF-IMPROVEMENT VERIFIED</span><h2>Policy changed. Outcomes improved.</h2></div><button className="text-btn" onClick={onTimeMachine}>Open Time Machine <ArrowRight size={15} /></button></div>
    <div className="improvement-grid">
      {changes.map((x) => <div className="improvement-stat" key={x.label}><span>{x.label}</span><div><s>{x.before}</s><ArrowRight size={14} /><strong>{x.after}</strong></div><em>{x.diff}</em></div>)}
    </div>
    <div className="policy-diff"><code><span>−</span> exact_party &amp;&amp; same_day</code><code><b>+</b> alias_map &amp;&amp; settlement_window(2d) &amp;&amp; unique_claim</code></div>
  </section>
}

function EscalationCard({ decision, onDecision }: { decision: string | null; onDecision: (value: string) => void }) {
  const escalation = buildEscalation(-14, 42)!
  return <section className="panel escalation-card">
    <div className="escalation-head"><div className="alert-icon"><AlertTriangle size={20} /></div><div><span className="section-kicker amber-text">HUMAN JUDGMENT REQUIRED · HIGH MATERIALITY</span><h2>Revenue timing changes the commitment envelope</h2></div><StatusPill tone="amber">Open</StatusPill></div>
    <p className="escalation-reason">{escalation.reason}</p>
    <div className="question-box"><span>CFO DECISION</span><strong>{escalation.question}</strong></div>
    <div className="evidence-chips">{escalation.evidence.map(x => <span key={x}>{x}</span>)}</div>
    <p className="recommendation"><BrainCircuit size={16} /><span><b>Agent recommendation:</b> {escalation.recommendation}</span></p>
    <div className="decision-actions">
      {decision ? <div className="decision-saved"><CheckCircle2 size={16} />Decision recorded: <strong>{decision}</strong><button onClick={() => onDecision('')}>Change</button></div> : <><button onClick={() => onDecision('Downside case')} className="primary-small">Adopt downside case</button><button onClick={() => onDecision('Base case')} className="secondary-small">Use base case</button></>}
    </div>
  </section>
}

function AgentControls({ generated, improved, injected, message, onGenerate, onImprove, onInject }: { generated: boolean; improved: boolean; injected: boolean; message: string; onGenerate: () => void; onImprove: () => void; onInject: () => void }) {
  return <section className="agent-controls" aria-label="Agent controls"><div className="agent-control-title"><div className="control-orb"><Bot size={16} /></div><div><strong>Agent lab</strong><span>Deterministic controls · local trace</span></div></div><div className="control-actions"><button onClick={onGenerate} className={generated ? 'control-done' : ''}><Zap size={14} />{generated ? 'Agent generated' : 'Generate Agent'}</button><button onClick={onImprove} className={improved ? 'control-done' : ''}><Sparkles size={14} />{improved ? 'Agent improved' : 'Improve Agent'}</button><button onClick={onInject} className={injected ? 'control-alert' : ''}><ShieldAlert size={14} />{injected ? 'Fraud case injected' : 'Inject new fraud case'}</button></div><div className="control-feedback"><span className={injected ? 'feedback-dot alert' : 'feedback-dot'} />{message}</div></section>
}

function Overview({ setView, decision, setDecision, completed, agentGenerated, agentImproved, injectedCase, controlMessage, onGenerate, onImprove, onInject }: { setView: (v: View) => void; decision: string | null; setDecision: (v: string) => void; completed: boolean; agentGenerated: boolean; agentImproved: boolean; injectedCase: boolean; controlMessage: string; onGenerate: () => void; onImprove: () => void; onInject: () => void }) {
  return <div className="view overview-view">
    <div className="welcome-row"><div><span className="page-label"><CircleDot size={12} /> AGENT RUN LF-260906-04</span><h2>Good morning. Your close is decision-ready.</h2><p>LedgerForge evaluated three finance goals, corrected two policy failures, and isolated one material assumption for review.</p></div><div className="run-status"><span className={completed ? 'pulse' : 'pulse running'} /><div><small>RUN STATUS</small><strong>{completed ? 'Completed with escalation' : 'Executing goals…'}</strong></div></div></div>
    <AgentControls generated={agentGenerated} improved={agentImproved} injected={injectedCase} message={controlMessage} onGenerate={onGenerate} onImprove={onImprove} onInject={onInject} />
    <div className="metrics-grid">
      <MetricCard label="Cash position" value="$598.4k" delta="1.5%" positive detail="vs. latest plan" icon={WalletCards} />
      <MetricCard label="Runway" value="11.8 mo" delta="2.4 mo" positive detail="after policy rerun" icon={Gauge} />
      <MetricCard label="Close confidence" value="94%" delta="33 pts" positive detail="from baseline" icon={Target} />
      <MetricCard label="Review queue" value="3 items" delta="$44.6k" detail="material exposure" icon={ShieldAlert} />
    </div>
    <div className="main-grid">
      <section className="panel runway-panel"><div className="panel-head"><div><span className="section-kicker">13-WEEK LIQUIDITY</span><h2>Cash trajectory</h2></div><div className="chart-total"><small>DECEMBER EXIT</small><strong>$478k</strong></div></div><CashChart /><div className="chart-footer"><div><strong>−$40.1k</strong><span>Average monthly burn</span></div><div><strong>+$9.2k</strong><span>Variance to downside</span></div><div><strong>Dec 18</strong><span>Minimum buffer date</span></div></div></section>
      <section className="panel goals-panel"><div className="panel-head"><div><span className="section-kicker">GOAL CONTRACTS</span><h2>Autonomous workstreams</h2></div><span className="overall-score">97<span>/100</span></span></div><div className="goals-list">{goals.map(g => <GoalRow goal={g} key={g.id} />)}</div><button className="full-link" onClick={() => setView('timeline')}>Inspect execution trace <ArrowRight size={15} /></button></section>
    </div>
    <ImprovementPanel baseline={baselineSnapshot} improved={improvedSnapshot} onTimeMachine={() => setView('time-machine')} />
    <div className="bottom-grid"><EscalationCard decision={decision} onDecision={(v) => setDecision(v || '')} /><AnomalyTable injectedCase={injectedCase} /></div>
  </div>
}

function AnomalyTable({ injectedCase = false }: { injectedCase?: boolean }) {
  const results = detectFraud(payments, 'improved').filter(r => r.flagged)
  return <section className="panel anomaly-card"><div className="panel-head"><div><span className="section-kicker">CONTROL EXCEPTIONS</span><h2>Payments to review</h2></div><StatusPill tone="red">{results.length + (injectedCase ? 1 : 0)} flagged</StatusPill></div>
    <div className="table-wrap"><table><thead><tr><th>Payment</th><th>Vendor</th><th>Value</th><th>Risk</th></tr></thead><tbody>{results.map(row => { const p = payments.find(x => x.id === row.paymentId)!; return <tr key={p.id}><td><span className="mono">{p.id}</span><small>{p.date}</small></td><td><strong>{p.vendor}</strong><small>{row.reasons.slice(0, 2).join(' · ')}</small></td><td>{fmtMoney(p.amount)}</td><td><span className="risk-score">{Math.round(row.score * 100)}</span></td></tr> })}{injectedCase && <tr className="injected-row"><td><span className="mono">P-2299</span><small>2026-09-06 · injected</small></td><td><strong>Helio Freight</strong><small>new vendor · duplicate bank acct</small></td><td>{fmtMoney(14750)}</td><td><span className="risk-score">99</span></td></tr>}</tbody></table></div>
  </section>
}

const phaseIcon: Record<TraceEvent['phase'], React.ElementType> = { plan: Target, tool: TerminalSquare, evaluate: FlaskConical, failure: AlertTriangle, improve: Sparkles, escalate: ShieldAlert, complete: CheckCircle2 }

function TimelineView({ extraTrace = [] }: { extraTrace?: TraceEvent[] }) {
  const [filter, setFilter] = useState<'all' | TraceEvent['phase']>('all')
  const allTrace = [...traceEvents, ...extraTrace]
  const visible = filter === 'all' ? allTrace : allTrace.filter(t => t.phase === filter)
  return <div className="view"><div className="page-title"><div><span className="page-label">AUDITABLE EXECUTION</span><h2>Execution trace</h2><p>Every plan, local tool call, failure, policy change, evaluation, and escalation in order.</p></div><button className="export-btn" onClick={() => downloadJson('ledgerforge-trace.json', traceEvents)}><Download size={15} />Export trace</button></div>
    <div className="trace-layout"><section className="panel trace-panel"><div className="trace-filters">{(['all', 'tool', 'failure', 'improve', 'evaluate', 'escalate'] as const).map(x => <button onClick={() => setFilter(x)} className={filter === x ? 'active' : ''} key={x}>{x === 'all' ? 'All events' : x}</button>)}</div>
      <div className="timeline">{visible.map((event) => { const Icon = phaseIcon[event.phase]; return <article className={`trace-event ${event.status}`} key={event.id}><div className="trace-time"><span>{event.time}</span><small>{event.id}</small></div><div className="trace-node"><Icon size={15} /></div><div className="trace-body"><div><StatusPill tone={event.status === 'success' ? 'green' : event.status === 'error' ? 'red' : event.status === 'warning' ? 'amber' : 'blue'}>{event.phase}</StatusPill>{event.tool && <code>{event.tool}</code>}{event.durationMs && <em>{event.durationMs}ms</em>}</div><h3>{event.title}</h3><p>{event.detail}</p></div></article> })}</div>
    </section><aside className="trace-aside"><section className="panel"><span className="section-kicker">RUN MANIFEST</span><dl><div><dt>Run ID</dt><dd>LF-260906-04</dd></div><div><dt>Dataset</dt><dd>synthetic-fy26-v1</dd></div><div><dt>Goal policy</dt><dd>cfo-close-1.2</dd></div><div><dt>Runtime</dt><dd>79.3 sec</dd></div><div><dt>Network calls</dt><dd>0</dd></div></dl></section><section className="panel integrity"><ShieldCheck size={28} /><h3>Trace integrity verified</h3><p>Event order, inputs, and policy revisions are deterministic and reproducible locally.</p><code>sha256: 91c7…e04a</code></section></aside></div>
  </div>
}

function ComparisonMetric({ label, before, after, inverse = false }: { label: string; before: number; after: number; inverse?: boolean }) {
  const delta = inverse ? before - after : after - before
  return <div className="compare-metric"><span>{label}</span><div className="compare-values"><strong className="before">{label.includes('Exposure') ? fmtMoney(before, true) : label.includes('Runway') ? `${before} mo` : pct(before)}</strong><ArrowRight size={16} /><strong className="after">{label.includes('Exposure') ? fmtMoney(after, true) : label.includes('Runway') ? `${after} mo` : pct(after)}</strong><em>+{label.includes('Exposure') ? fmtMoney(delta, true) : label.includes('Runway') ? delta.toFixed(1) : Math.round(delta * 100)}{label.includes('Runway') ? ' mo' : label.includes('Exposure') ? '' : ' pts'}</em></div></div>
}

function TimeMachineView() {
  const baselineMatches = matchTransactions(bankEntries, ledgerEntries, 'baseline')
  const improvedMatches = matchTransactions(bankEntries, ledgerEntries, 'improved')
  return <div className="view"><div className="page-title"><div><span className="page-label"><GitCompareArrows size={12} /> CAUSAL COMPARISON</span><h2>Time Machine</h2><p>Replay the same frozen inputs against each policy. The only variable is agent learning.</p></div><StatusPill tone="green">Deterministic rerun</StatusPill></div>
    <section className="panel time-hero"><div className="version baseline"><span>BASELINE · 09:41:12</span><h3>Policy v1</h3><p>Exact names, same-day settlement, independent payment scoring.</p><StatusPill tone="red">3 gates failed</StatusPill></div><div className="machine-core"><div><RefreshCcw size={23} /></div><span>SAME INPUTS</span><small>8 bank · 8 ledger · 8 payments</small></div><div className="version improved"><span>IMPROVED · 09:42:08</span><h3>Policy v2</h3><p>Alias-aware matching, windows, cluster and timing signals.</p><StatusPill tone="green">All gates passed</StatusPill></div></section>
    <div className="compare-grid"><section className="panel"><div className="panel-head"><div><span className="section-kicker">MEASURED OUTCOME</span><h2>Evaluator delta</h2></div></div><div className="compare-list"><ComparisonMetric label="Match recall" before={baselineSnapshot.reconciliation.recall} after={improvedSnapshot.reconciliation.recall} /><ComparisonMetric label="Fraud recall" before={baselineSnapshot.fraud.recall} after={improvedSnapshot.fraud.recall} /><ComparisonMetric label="Confidence" before={baselineSnapshot.confidence} after={improvedSnapshot.confidence} /><ComparisonMetric label="Unresolved Exposure" before={baselineSnapshot.unmatchedCash} after={improvedSnapshot.unmatchedCash} inverse /></div></section>
      <section className="panel diff-panel"><div className="panel-head"><div><span className="section-kicker">POLICY PATCH</span><h2>What the agent changed</h2></div><code>v1 → v2</code></div><div className="code-diff"><p className="minus"><span>−</span> party = raw_description</p><p className="plus"><span>+</span> party = normalize(alias_map)</p><p className="minus"><span>−</span> settlement_days = 0</p><p className="plus"><span>+</span> settlement_days = ±2</p><p className="minus"><span>−</span> score(payment)</p><p className="plus"><span>+</span> score(payment + cluster)</p></div><div className="why-box"><BrainCircuit size={18} /><p><b>Why:</b> Evaluator evidence isolated name/date rigidity and missing cross-payment context—not data quality—as the failure sources.</p></div></section>
    </div>
    <section className="panel match-matrix"><div className="panel-head"><div><span className="section-kicker">ROW-LEVEL EVIDENCE</span><h2>Reconciliation replay</h2></div><span>{improvedMatches.filter(x => x.ledgerId).length}/{improvedMatches.length} resolved</span></div><div className="table-wrap"><table><thead><tr><th>Bank line</th><th>Baseline v1</th><th>Improved v2</th><th>Policy effect</th></tr></thead><tbody>{improvedMatches.map((row, i) => <tr key={row.bankId}><td><span className="mono">{row.bankId}</span><small>{bankEntries[i].description}</small></td><td>{baselineMatches[i].ledgerId ? <span className="match yes"><Check size={13} />{baselineMatches[i].ledgerId}</span> : <span className="match no"><X size={13} />Unmatched</span>}</td><td><span className="match yes"><Check size={13} />{row.ledgerId}</span></td><td><small>{row.reason}</small></td></tr>)}</tbody></table></div></section>
  </div>
}

function buildPacket(decision: string | null) {
  return { product: 'LedgerForge', runId: 'LF-260906-04', generatedAt: '2026-09-06T09:42:22+05:30', mode: 'local-deterministic', goals, baseline: baselineSnapshot, improved: improvedSnapshot, failures: classifyFailure(baselineSnapshot), escalation: buildEscalation(-14, 42), cfoDecision: decision || 'pending', trace: traceEvents, attestation: { networkCalls: 0, dataset: 'synthetic-fy26-v1', checksum: 'sha256:91c7d10ab328e04a' } }
}

function downloadJson(name: string, value: unknown) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' })); a.download = name; a.click(); URL.revokeObjectURL(a.href)
}

function EvidenceView({ decision }: { decision: string | null }) {
  const packet = buildPacket(decision)
  return <div className="view"><div className="page-title"><div><span className="page-label"><FileCheck2 size={12} /> BOARD-READY OUTPUT</span><h2>CFO briefing & evidence packet</h2><p>A concise decision brief backed by replayable inputs, policies, evaluations, and traces.</p></div><button className="run-btn" onClick={() => downloadJson('ledgerforge-evidence-LF-260906-04.json', packet)}><Download size={15} />Download JSON packet</button></div>
    <div className="brief-grid"><main className="brief-paper panel"><div className="brief-header"><Logo /><div><span>CONFIDENTIAL · FINANCE</span><strong>06 SEP 2026</strong></div></div><hr/><span className="section-kicker">EXECUTIVE BRIEF · SEPTEMBER CLOSE</span><h1>Cash position is reconciled; payment controls require two holds.</h1><p className="brief-lede">LedgerForge recommends closing August at <b>$598.4k cash</b>, placing both Novacore payments on hold, and using the downside revenue case until the Acme renewal is signed.</p>
      <div className="brief-callouts"><div><small>RECONCILED</small><strong>100%</strong><span>8 of 8 bank lines</span></div><div><small>CONTROL EXPOSURE</small><strong>$44.6k</strong><span>3 payments flagged</span></div><div><small>RUNWAY</small><strong>11.8 mo</strong><span>downside: 9.1 mo</span></div></div>
      <BriefSection number="01" title="Close recommendation"><p>Approve the cash reconciliation. Eight ledger entries map one-to-one to bank activity after applying tested alias normalization and a two-day settlement window. No residual unmatched cash remains.</p><ul><li>All match links retain source IDs and confidence.</li><li>Policy v2 achieved 100% recall with no duplicate claims.</li></ul></BriefSection>
      <BriefSection number="02" title="Immediate control actions"><p>Hold <b>P-2204</b> and <b>P-2205</b> pending callback verification. The identical $9,800 Novacore payments arrived after-hours from a new vendor. Review the $25,000 Zentara payment independently.</p></BriefSection>
      <BriefSection number="03" title="Decision required"><p>The October Acme renewal is not signed. Including it overstates downside runway by 2.7 months. <b>Recommended: use downside case for commitments.</b></p><div className="signature-line"><span>CFO disposition</span><strong>{decision || 'Pending CFO decision'}</strong></div></BriefSection>
      <footer><span>Generated locally by LedgerForge · Run LF-260906-04</span><span>Evidence checksum 91c7…e04a</span></footer>
    </main><aside className="packet-sidebar"><section className="panel packet-index"><span className="section-kicker">PACKET CONTENTS</span>{[['01','Executive briefing','Ready'],['02','Source manifest','Verified'],['03','Match ledger','8 rows'],['04','Control exceptions','3 rows'],['05','Policy diff','v1 → v2'],['06','Execution trace','11 events'],['07','Evaluator report','Passed']].map(x => <div key={x[0]}><span>{x[0]}</span><strong>{x[1]}</strong><em>{x[2]}</em></div>)}</section><section className="panel attest"><ShieldCheck size={25}/><h3>Evidence attestation</h3><p>All sources are synthetic and deterministic. No external network or credentials were used.</p><div><Check size={14}/>Input checksum pinned</div><div><Check size={14}/>Policy versions retained</div><div><Check size={14}/>Rerun outcomes measured</div></section></aside></div>
  </div>
}

function BriefSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) { return <section className="brief-section"><div><span>{number}</span><h2>{title}</h2></div>{children}</section> }

function AboutModal({ close }: { close: () => void }) { return <div className="modal-backdrop" onMouseDown={close}><div className="modal" onMouseDown={e => e.stopPropagation()}><button className="modal-close" onClick={close}><X size={18}/></button><div className="about-mark"><Logo /></div><h2>Finance operations you can interrogate.</h2><p>LedgerForge is a deterministic demonstration of goal-driven, tool-using finance automation. It plans work, runs local tools, measures its own output, learns from classified failures, reruns against frozen inputs, and escalates ambiguity rather than inventing certainty.</p><div className="about-grid"><div><ShieldCheck/><strong>Local by design</strong><span>No credentials or external services</span></div><div><Search/><strong>Evidence first</strong><span>Every conclusion links to a trace</span></div><div><Bot/><strong>Goal driven</strong><span>Thresholds define when work is done</span></div><div><Sparkles/><strong>Actually adaptive</strong><span>Before/after evaluation is measured</span></div></div><div className="modal-note"><b>Demo data:</b> Orbit Systems is fictional. All transactions and conclusions are synthetic and repeatable.</div><button className="run-btn full" onClick={close}>Enter console</button></div></div> }

function App() {
  const [view, setView] = useState<View>('overview')
  const [running, setRunning] = useState(false)
  const [completed, setCompleted] = useState(true)
  const [decision, setDecisionRaw] = useState<string | null>(() => localStorage.getItem('ledgerforge-decision'))
  const [about, setAbout] = useState(false)
  const [mobile, setMobile] = useState(false)
  const [agentGenerated, setAgentGenerated] = useState(false)
  const [agentImproved, setAgentImproved] = useState(false)
  const [injectedCase, setInjectedCase] = useState(false)
  const [controlMessage, setControlMessage] = useState('Ready · 3 goal contracts available for local execution')
  const [extraTrace, setExtraTrace] = useState<TraceEvent[]>([])
  const setDecision = (v: string) => { setDecisionRaw(v || null); if (v) localStorage.setItem('ledgerforge-decision', v); else localStorage.removeItem('ledgerforge-decision') }
  const run = () => { setRunning(true); setCompleted(false); setView('overview'); window.setTimeout(() => { setRunning(false); setCompleted(true) }, 1450) }
  const addControlTrace = (event: TraceEvent) => setExtraTrace(prev => [...prev, event])
  const generateAgent = () => { setAgentGenerated(true); setControlMessage('Agent generated · 3 CFO workflows compiled into a goal contract'); addControlTrace({ id: 'T12', time: '09:42:31', phase: 'plan', title: 'Agent generated from goal contract', detail: 'Compiled close, controls, and runway workflows from deterministic local policies.', tool: 'agent.generate_local', status: 'success', durationMs: 12 }) }
  const improveAgent = () => { setAgentImproved(true); setControlMessage('Agent improved · policy v2 verified against the frozen fixture'); addControlTrace({ id: 'T13', time: '09:42:44', phase: 'improve', title: 'Agent improvement applied', detail: 'Promoted alias, settlement-window, and duplicate-cluster signals after evaluator evidence.', tool: 'agent.improve_local', status: 'success', durationMs: 19 }) }
  const injectFraud = () => { setInjectedCase(true); setControlMessage('Fraud case escalated · P-2299 Helio Freight · $14,750'); addControlTrace({ id: 'T14', time: '09:42:57', phase: 'escalate', title: 'Synthetic fraud case injected', detail: 'P-2299 Helio Freight · $14,750 · duplicate bank account and new vendor signals.', tool: 'fixture.inject_fraud', status: 'warning', durationMs: 4 }) }
  const reset = () => { setDecision(''); setView('overview'); setCompleted(true); setAbout(false); setAgentGenerated(false); setAgentImproved(false); setInjectedCase(false); setControlMessage('Ready · 3 goal contracts available for local execution'); setExtraTrace([]) }
  const title = useMemo(() => ({ overview: 'Command center', timeline: 'Execution trace', 'time-machine': 'Time Machine', evidence: 'Evidence packet' })[view], [view])
  return <div className={`app-shell ${mobile ? 'mobile-open' : ''}`}>
    <div className="mobile-overlay" onClick={() => setMobile(false)} />
    <Sidebar view={view} setView={(v) => { setView(v); setMobile(false); document.title = `${title} — LedgerForge` }} openAbout={() => setAbout(true)} />
    <main className="content"><Header running={running} run={run} reset={reset} mobileNav={() => setMobile(true)} />
      {view === 'overview' && <Overview setView={setView} decision={decision} setDecision={setDecision} completed={completed} agentGenerated={agentGenerated} agentImproved={agentImproved} injectedCase={injectedCase} controlMessage={controlMessage} onGenerate={generateAgent} onImprove={improveAgent} onInject={injectFraud} />}
      {view === 'timeline' && <TimelineView extraTrace={extraTrace} />}
      {view === 'time-machine' && <TimeMachineView />}
      {view === 'evidence' && <EvidenceView decision={decision} />}
    </main>
    {about && <AboutModal close={() => setAbout(false)} />}
  </div>
}

export default App
