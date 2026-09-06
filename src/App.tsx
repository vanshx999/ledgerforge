import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, BookOpen,
  Bot, BrainCircuit, Check, CheckCircle2, ChevronDown, CircleDot, Clock3,
  Database, Download, FileCheck2, FileText, FlaskConical, Gauge, GitCompareArrows,
  HelpCircle, LayoutDashboard, Menu, Play, RefreshCcw, Search, Settings2, ShieldAlert,
  ShieldCheck, Sparkles, Target, TerminalSquare, TrendingDown, WalletCards, X, Zap,
} from 'lucide-react'
import { bankEntries, monthlyCash, payments } from './data'
import {
  baselineSnapshot, buildEscalation, classifyFailure, createSnapshot, detectFraud,
  matchTransactions, traceEvents,
} from './engine'
import { ledgerEntries } from './data'
import { DEMO_EMAIL, DEMO_PASSWORD, demoSession, googleSignInAvailable, loadSession, isDemoCredential, parseGoogleCredential, saveSession, SESSION_KEY, type AuthSession } from './auth'
import { appendHistory, getHistory, type CfoHistoryRecord } from './history'
import { clearDemoData, DEFAULT_REVIEW_SETTINGS, loadReviewSettings, saveReviewSettings, type ReviewSettings } from './settings'
import type { Goal, RunSnapshot, TraceEvent } from './types'
import AuthCanvasScene from './AuthCanvasScene'

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

function Sidebar({ view, setView, openAbout, signOut, account, openSettings, loadData, dataMessage }: { view: View; setView: (view: View) => void; openAbout: () => void; signOut: () => void; account: AuthSession; openSettings: () => void; loadData: () => void; dataMessage: string }) {
  const items = [
    { id: 'overview' as View, label: 'Close overview', icon: LayoutDashboard },
    { id: 'timeline' as View, label: 'Review activity', icon: Activity, badge: '11' },
    { id: 'time-machine' as View, label: 'CFO Time Machine', icon: GitCompareArrows },
    { id: 'evidence' as View, label: 'Board packet', icon: FileCheck2 },
  ]
  return <aside id="ledgerforge-sidebar" className="sidebar">
    <Logo />
    <div className="workspace-switch"><div className="workspace-icon">OR</div><div><small>WORKSPACE</small><strong>Orbit Systems</strong></div><ChevronDown size={14} /></div>
    <nav>
      <span className="nav-label">SEPTEMBER CLOSE</span>
      {items.map(({ id, label, icon: Icon, badge }) => <button key={id} className={view === id ? 'active' : ''} onClick={() => setView(id)}><Icon size={17} /><span>{label}</span>{badge && <em>{badge}</em>}</button>)}
      <span className="nav-label second">REFERENCE</span>
      <button onClick={loadData} title="Reload the synthetic demo fixtures"><Database size={17} /><span>Demo data</span><i className="connected-dot" /></button>
      <button onClick={openSettings} title="Choose how the close review behaves"><Settings2 size={17} /><span>Review settings</span></button>
    </nav>
    <div className="sidebar-bottom">
      <div className="local-banner"><ShieldCheck size={16} /><div><strong>Local-only mode</strong><span>{dataMessage || 'Synthetic demo data ready'}</span></div></div>
      <button className="about-link" onClick={openAbout}><HelpCircle size={16} />About LedgerForge</button>
      <div className="profile">{account.picture ? <img className="avatar profile-photo" src={account.picture} alt="" /> : <div className="avatar">{account.name.split(' ').map(part => part[0]).slice(0, 2).join('')}</div>}<div><strong>{account.name}</strong><small>{account.kind === 'google' ? account.email : 'CFO workspace owner'}</small></div><span className="online" /></div>
      <button className="sign-out" onClick={signOut}>Sign out</button>
    </div>
  </aside>
}

function Header({ running, run, reset, mobileNav, mobileOpen }: { running: boolean; run: () => void; reset: () => void; mobileNav: () => void; mobileOpen: boolean }) {
  return <header className="topbar">
    <button className="mobile-menu" aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileOpen} aria-controls="ledgerforge-sidebar" onClick={mobileNav}><Menu size={20} /></button>
    <div><div className="eyebrow">ORBIT SYSTEMS · SEPTEMBER CLOSE</div><h1>Close review</h1></div>
    <div className="top-actions">
      <div className="data-fresh"><span /><div><small>DATA FRESHNESS</small><strong>Live · 2m ago</strong></div></div>
      <button className="icon-btn" title="Reset demo" onClick={reset}><RefreshCcw size={17} /></button>
      <button className="run-btn" disabled={running} onClick={run}>{running ? <><span className="spinner" />Checking the close</> : <><Play size={15} fill="currentColor" />Run CFO Time Machine</>}</button>
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

function LedgerScene() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [motion, setMotion] = useState(true)
  useEffect(() => { const query = window.matchMedia('(prefers-reduced-motion: reduce)'); const update = () => setMotion(!query.matches); update(); query.addEventListener?.('change', update); return () => query.removeEventListener?.('change', update) }, [])
  const move = (event: React.PointerEvent<HTMLDivElement>) => { if (!motion || event.pointerType !== 'mouse') return; const box = event.currentTarget.getBoundingClientRect(); setTilt({ x: ((event.clientY - box.top) / box.height - .5) * -5, y: ((event.clientX - box.left) / box.width - .5) * 7 }) }
  return <div className="ledger-scene" onPointerMove={move} onPointerLeave={() => setTilt({ x: 0, y: 0 })} aria-hidden="true"><div className="scene-orbit"/><div className="scene-stack" style={{ transform: motion ? `rotateX(${60 + tilt.x}deg) rotateZ(${-29 + tilt.y}deg)` : 'rotateX(60deg) rotateZ(-29deg)' }}><div className="scene-sheet sheet-back"/><div className="scene-sheet sheet-mid"><span/><span/><span/></div><div className="scene-sheet sheet-front"><div className="scene-total">$598.4k</div><div className="scene-bars"><i/><i/><i/><i/><i/></div></div></div><div className="scene-caption"><span>LOCAL CASH POSITION</span><b>8/8 reconciled</b></div></div>
}

function TiltCard({ className, children }: { className: string; children: React.ReactNode }) {
  const [transform, setTransform] = useState('')
  const [motion, setMotion] = useState(true)
  useEffect(() => { const query = window.matchMedia('(prefers-reduced-motion: reduce)'); const update = () => setMotion(!query.matches); update(); query.addEventListener?.('change', update); return () => query.removeEventListener?.('change', update) }, [])
  const move = (event: React.PointerEvent<HTMLElement>) => {
    if (!motion || event.pointerType !== 'mouse') return
    const box = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - box.left) / box.width - .5) * 4
    const y = ((event.clientY - box.top) / box.height - .5) * -4
    setTransform(`perspective(800px) rotateX(${y}deg) rotateY(${x}deg) translateY(-5px)`)
  }
  return <article className={`${className} tactile-card`} style={motion && transform ? { transform } : undefined} onPointerMove={move} onPointerLeave={() => setTransform('')}>{children}</article>
}

function CfoHistory({ records, account, onReplay, onEvidence }: { records: CfoHistoryRecord[]; account: AuthSession; onReplay: () => void; onEvidence: () => void }) {
  if (!records.length) return <section className="cfo-history empty-history"><div><span>YOUR CFO HISTORY</span><h3>Your review history starts here.</h3><p>{account.name}, run your first close review to build a private, browser-local record of decisions and evidence.</p></div><button className="history-run" onClick={onReplay}>Run first review <ArrowRight size={15}/></button></section>
  const trend = records.slice(0, 5).reverse()
  return <section className="cfo-history"><div className="history-heading"><div><span>YOUR CFO HISTORY</span><h3>Previous reviews, kept locally.</h3><p>Stored in this browser for {account.kind === 'demo' ? 'the demo account' : account.email}. It is not synced to a server.</p></div><button onClick={onEvidence}>Open latest board packet <ArrowRight size={15}/></button></div><div className="history-body"><div className="score-trend"><div className="trend-label"><b>Review confidence</b><span>{records[0].score}/100 latest</span></div><div className="trend-bars">{trend.map(record => <i key={record.id} style={{ height: `${Math.max(18, record.score)}%` }} title={`${record.title}: ${record.score}/100`} />)}</div><div className="trend-axis">{trend.map(record => <span key={record.id}>{record.date.split('·')[0]}</span>)}</div></div><div className="history-list">{records.slice(0, 3).map(record => <article key={record.id}><div><b>{record.title}</b><span>{record.date} · {record.activity}</span></div><div><strong>{record.score}</strong><small>{record.evidence}</small></div></article>)}</div></div></section>
}

function AgentControls({ generated, improved, injected, message, onGenerate, onImprove, onInject }: { generated: boolean; improved: boolean; injected: boolean; message: string; onGenerate: () => void; onImprove: () => void; onInject: () => void }) {
  return <section className="demo-controls" aria-label="Demo controls"><div><strong>Try the demo</strong><span>These controls add entries to the review record.</span></div><div className="control-actions"><button onClick={onGenerate} className={generated ? 'control-done' : ''}><Zap size={14} />{generated ? 'Agent generated' : 'Generate Agent'}</button><button onClick={onImprove} className={improved ? 'control-done' : ''}><Sparkles size={14} />{improved ? 'Agent improved' : 'Improve Agent'}</button><button onClick={onInject} className={injected ? 'control-alert' : ''}><ShieldAlert size={14} />{injected ? 'Fraud case injected' : 'Inject fraud case'}</button></div><p className="control-feedback"><span className={injected ? 'feedback-dot alert' : 'feedback-dot'} />{message}</p></section>
}

function Overview({ setView, decision, setDecision, completed, running, run, agentGenerated, agentImproved, injectedCase, controlMessage, onGenerate, onImprove, onInject, history, account, snapshot, settings }: { setView: (v: View) => void; decision: string | null; setDecision: (v: string) => void; completed: boolean; running: boolean; run: () => void; agentGenerated: boolean; agentImproved: boolean; injectedCase: boolean; controlMessage: string; onGenerate: () => void; onImprove: () => void; onInject: () => void; history: CfoHistoryRecord[]; account: AuthSession; snapshot: RunSnapshot; settings: ReviewSettings }) {
  const matched = snapshot.reconciliation.truePositives
  const flagged = snapshot.fraud.truePositives + snapshot.fraud.falsePositives + (injectedCase ? 1 : 0)
  const holdExposure = snapshot.flaggedExposure + (injectedCase ? 14750 : 0)
  return <div className="view story-view">
    <section className="close-hero"><div className="hero-copy"><div className="hero-status"><span className={completed ? 'pulse' : 'pulse running'} />{completed ? 'September close reviewed' : 'Review in progress'}</div><h2>Month-end close,<br/><em>reviewed in 90 seconds.</em></h2><p>Cash is reconciled, payment risk is contained, and one revenue assumption needs your call before commitments are made.</p><button className="story-cta" disabled={running} onClick={run}>{running ? <><span className="spinner" />Rechecking the close</> : <><Play size={16} fill="currentColor" />Run CFO Time Machine</>}</button></div><div className="hero-summary"><span>SEPTEMBER CASH POSITION</span><strong>$598.4k</strong><p><ArrowUpRight size={14} />$9.2k ahead of downside case</p><div><b>11.8 mo</b><small>operating runway</small></div><LedgerScene/></div></section>
    <section className="progress-strip" aria-label="Close review progress"><div className="progress-step done"><span>01</span><strong>Inspect</strong><small>8 bank lines read</small></div><div className="progress-line"/><div className="progress-step done"><span>02</span><strong>Find issues</strong><small>3 payments flagged</small></div><div className="progress-line"/><div className="progress-step done"><span>03</span><strong>Improve</strong><small>matching corrected</small></div><div className="progress-line"/><div className="progress-step current"><span>04</span><strong>Recheck</strong><small>ready for CFO</small></div></section>
    <section className="outcomes"><div className="outcome-heading"><div><h3>What matters now</h3><p>Three outcomes from the close review. Details remain available when you need them.</p></div><button className="quiet-link" onClick={() => setView('timeline')}>Review activity <ArrowRight size={15}/></button></div><div className="outcome-grid"><TiltCard className="outcome-card positive"><div className="outcome-icon"><CheckCircle2 size={19}/></div><span>CASH RECONCILED</span><h4>{matched} of 8 bank lines accounted for.</h4><p>Settlement window: {settings.settlementWindowDays} day{settings.settlementWindowDays === 1 ? '' : 's'} · same frozen inputs.</p><strong>$598.4k <small>close cash</small></strong></TiltCard><TiltCard className="outcome-card risk"><div className="outcome-icon"><ShieldAlert size={19}/></div><span>PAYMENT RISK FOUND</span><h4>{flagged} payment{flagged === 1 ? '' : 's'} should be reviewed.</h4><p>{snapshot.fraud.falsePositives} avoidable false positive{snapshot.fraud.falsePositives === 1 ? '' : 's'} at {settings.fraudSensitivity} sensitivity.</p><strong>{fmtMoney(holdExposure, true)} <small>on hold</small></strong></TiltCard><TiltCard className="outcome-card neutral"><div className="outcome-icon"><Gauge size={19}/></div><span>RUNWAY PROTECTED</span><h4>Operating runway is {snapshot.runwayMonths.toFixed(1)} months.</h4><p>The close remains above the downside case through December.</p><strong>+2.7 mo <small>decision buffer</small></strong></TiltCard></div></section>
    <section className="cfo-decision"><div className="decision-marker"><AlertTriangle size={20}/></div><div><span>CFO DECISION NEEDED</span><h3>Use the downside case for commitments.</h3><p>The unsigned Acme renewal changes runway by 2.7 months. Keep the board case conservative until the renewal is signed.</p></div>{decision ? <div className="decision-recorded"><Check size={14}/>Decision recorded: {decision}</div> : <button className="decision-primary" onClick={() => setDecision('Downside case')}>Adopt downside case <ArrowRight size={15}/></button>}</section>
    <section className="secondary-views"><div><span>SEE THE EVIDENCE</span><p>Open the detailed review only when you need the supporting record.</p></div><button onClick={() => setView('time-machine')}><GitCompareArrows size={16}/><span><b>CFO Time Machine</b><small>Compare the first and improved review</small></span><ArrowRight size={15}/></button><button onClick={() => setView('evidence')}><FileCheck2 size={16}/><span><b>Board packet</b><small>Download the CFO briefing and evidence</small></span><ArrowRight size={15}/></button><div className="secondary-actions"><AgentControls generated={agentGenerated} improved={agentImproved} injected={injectedCase} message={controlMessage} onGenerate={onGenerate} onImprove={onImprove} onInject={onInject} /></div></section>
    <CfoHistory records={history} account={account} onReplay={run} onEvidence={() => setView('evidence')}/>
  </div>
}

function AnomalyTable({ injectedCase = false, settings = DEFAULT_REVIEW_SETTINGS }: { injectedCase?: boolean; settings?: ReviewSettings }) {
  const results = detectFraud(payments, 'improved', settings.fraudSensitivity, settings.materialityThreshold).filter(r => r.flagged)
  return <section className="panel anomaly-card"><div className="panel-head"><div><span className="section-kicker">CONTROL EXCEPTIONS</span><h2>Payments to review</h2></div><StatusPill tone="red">{results.length + (injectedCase ? 1 : 0)} flagged</StatusPill></div>
    <div className="table-wrap"><table><thead><tr><th>Payment</th><th>Vendor</th><th>Value</th><th>Risk</th></tr></thead><tbody>{results.map(row => { const p = payments.find(x => x.id === row.paymentId)!; return <tr key={p.id}><td><span className="mono">{p.id}</span><small>{p.date}</small></td><td><strong>{p.vendor}</strong><small>{row.reasons.slice(0, 2).join(' · ')}</small></td><td>{fmtMoney(p.amount)}</td><td><span className="risk-score">{Math.round(row.score * 100)}</span></td></tr> })}{injectedCase && <tr className="injected-row"><td><span className="mono">P-2299</span><small>2026-09-06 · injected</small></td><td><strong>Helio Freight</strong><small>new vendor · duplicate bank acct</small></td><td>{fmtMoney(14750)}</td><td><span className="risk-score">99</span></td></tr>}</tbody></table></div>
  </section>
}

const phaseIcon: Record<TraceEvent['phase'], React.ElementType> = { plan: Target, tool: TerminalSquare, evaluate: FlaskConical, failure: AlertTriangle, improve: Sparkles, escalate: ShieldAlert, complete: CheckCircle2 }

function TimelineView({ extraTrace = [] }: { extraTrace?: TraceEvent[] }) {
  const [filter, setFilter] = useState<'all' | TraceEvent['phase']>('all')
  const allTrace = [...traceEvents, ...extraTrace]
  const visible = filter === 'all' ? allTrace : allTrace.filter(t => t.phase === filter)
  return <div className="view"><div className="page-title"><div><span className="page-label">AUDITABLE EXECUTION</span><h2>Execution trace</h2><p>Every plan, local tool call, failure, policy change, evaluation, and escalation in order.</p></div><button className="export-btn" onClick={() => downloadJson('ledgerforge-trace.json', allTrace)}><Download size={15} />Export trace</button></div>
    <div className="trace-layout"><section className="panel trace-panel"><div className="trace-filters">{(['all', 'tool', 'failure', 'improve', 'evaluate', 'escalate'] as const).map(x => <button onClick={() => setFilter(x)} className={filter === x ? 'active' : ''} key={x}>{x === 'all' ? 'All events' : x}</button>)}</div>
      <div className="timeline">{visible.map((event) => { const Icon = phaseIcon[event.phase]; return <article className={`trace-event ${event.status}`} key={event.id}><div className="trace-time"><span>{event.time}</span><small>{event.id}</small></div><div className="trace-node"><Icon size={15} /></div><div className="trace-body"><div><StatusPill tone={event.status === 'success' ? 'green' : event.status === 'error' ? 'red' : event.status === 'warning' ? 'amber' : 'blue'}>{event.phase}</StatusPill>{event.tool && <code>{event.tool}</code>}{event.durationMs && <em>{event.durationMs}ms</em>}</div><h3>{event.title}</h3><p>{event.detail}</p></div></article> })}</div>
    </section><aside className="trace-aside"><section className="panel"><span className="section-kicker">RUN MANIFEST</span><dl><div><dt>Run ID</dt><dd>LF-260906-04</dd></div><div><dt>Dataset</dt><dd>synthetic-fy26-v1</dd></div><div><dt>Goal policy</dt><dd>cfo-close-1.2</dd></div><div><dt>Runtime</dt><dd>79.3 sec</dd></div><div><dt>Network calls</dt><dd>0</dd></div></dl></section><section className="panel integrity"><ShieldCheck size={28} /><h3>Trace integrity verified</h3><p>Event order, inputs, and policy revisions are deterministic and reproducible locally.</p><code>sha256: 91c7…e04a</code></section></aside></div>
  </div>
}

function ComparisonMetric({ label, before, after, inverse = false }: { label: string; before: number; after: number; inverse?: boolean }) {
  const delta = inverse ? before - after : after - before
  return <div className="compare-metric"><span>{label}</span><div className="compare-values"><strong className="before">{label.includes('Exposure') ? fmtMoney(before, true) : label.includes('Runway') ? `${before} mo` : pct(before)}</strong><ArrowRight size={16} /><strong className="after">{label.includes('Exposure') ? fmtMoney(after, true) : label.includes('Runway') ? `${after} mo` : pct(after)}</strong><em>+{label.includes('Exposure') ? fmtMoney(delta, true) : label.includes('Runway') ? delta.toFixed(1) : Math.round(delta * 100)}{label.includes('Runway') ? ' mo' : label.includes('Exposure') ? '' : ' pts'}</em></div></div>
}

function TimeMachineView({ settings }: { settings: ReviewSettings }) {
  const baselineMatches = matchTransactions(bankEntries, ledgerEntries, 'baseline')
  const improvedMatches = matchTransactions(bankEntries, ledgerEntries, 'improved', settings.settlementWindowDays)
  const configured = createSnapshot('improved', settings)
  return <div className="view"><div className="page-title"><div><span className="page-label"><GitCompareArrows size={12} /> CAUSAL COMPARISON</span><h2>Time Machine</h2><p>Replay the same frozen inputs against each policy. The only variable is agent learning.</p><small className="settings-readout">Current review: ±{settings.settlementWindowDays}d settlement · {settings.fraudSensitivity} risk · {fmtMoney(settings.materialityThreshold)} materiality</small></div><StatusPill tone="green">Deterministic rerun</StatusPill></div>
    <section className="panel time-hero"><div className="version baseline"><span>BASELINE · 09:41:12</span><h3>Policy v1</h3><p>Exact names, same-day settlement, independent payment scoring.</p><StatusPill tone="red">3 gates failed</StatusPill></div><div className="machine-core"><div><RefreshCcw size={23} /></div><span>SAME INPUTS</span><small>8 bank · 8 ledger · 8 payments</small></div><div className="version improved"><span>IMPROVED · CONFIGURED</span><h3>Policy v2</h3><p>Alias-aware matching, configured settlement and materiality gates.</p><StatusPill tone={configured.reconciliation.recall >= .9 && configured.fraud.falsePositives === 0 ? 'green' : 'amber'}>{Math.round(configured.reconciliation.recall * 100)}% match · {configured.fraud.truePositives + configured.fraud.falsePositives} flags</StatusPill></div></section>
    <div className="compare-grid"><section className="panel"><div className="panel-head"><div><span className="section-kicker">MEASURED OUTCOME</span><h2>Evaluator delta</h2></div></div><div className="compare-list"><ComparisonMetric label="Match recall" before={baselineSnapshot.reconciliation.recall} after={configured.reconciliation.recall} /><ComparisonMetric label="Fraud recall" before={baselineSnapshot.fraud.recall} after={configured.fraud.recall} /><ComparisonMetric label="Confidence" before={baselineSnapshot.confidence} after={configured.confidence} /><ComparisonMetric label="Unresolved Exposure" before={baselineSnapshot.unmatchedCash} after={configured.unmatchedCash} inverse /></div></section>
      <section className="panel diff-panel"><div className="panel-head"><div><span className="section-kicker">POLICY PATCH</span><h2>What the agent changed</h2></div><code>v1 → v2</code></div><div className="code-diff"><p className="minus"><span>−</span> party = raw_description</p><p className="plus"><span>+</span> party = normalize(alias_map)</p><p className="minus"><span>−</span> settlement_days = 0</p><p className="plus"><span>+</span> settlement_days = ±2</p><p className="minus"><span>−</span> score(payment)</p><p className="plus"><span>+</span> score(payment + cluster)</p></div><div className="why-box"><BrainCircuit size={18} /><p><b>Why:</b> Evaluator evidence isolated name/date rigidity and missing cross-payment context—not data quality—as the failure sources.</p></div></section>
    </div>
    <section className="panel match-matrix"><div className="panel-head"><div><span className="section-kicker">ROW-LEVEL EVIDENCE</span><h2>Reconciliation replay</h2></div><span>{improvedMatches.filter(x => x.ledgerId).length}/{improvedMatches.length} resolved</span></div><div className="table-wrap"><table><thead><tr><th>Bank line</th><th>Baseline v1</th><th>Improved v2</th><th>Policy effect</th></tr></thead><tbody>{improvedMatches.map((row, i) => <tr key={row.bankId}><td><span className="mono">{row.bankId}</span><small>{bankEntries[i].description}</small></td><td>{baselineMatches[i].ledgerId ? <span className="match yes"><Check size={13} />{baselineMatches[i].ledgerId}</span> : <span className="match no"><X size={13} />Unmatched</span>}</td><td><span className="match yes"><Check size={13} />{row.ledgerId}</span></td><td><small>{row.reason}</small></td></tr>)}</tbody></table></div></section>
  </div>
}

function buildPacket(decision: string | null, settings: ReviewSettings, improved: RunSnapshot, extraTrace: TraceEvent[], injectedCase: boolean) {
  const trace = [...traceEvents, ...extraTrace]
  return { product: 'LedgerForge', runId: 'LF-260906-04', generatedAt: '2026-09-06T09:42:22+05:30', mode: 'local-deterministic', goals, settings, baseline: baselineSnapshot, improved, failures: classifyFailure(baselineSnapshot), escalation: buildEscalation(-14, 42), cfoDecision: decision || 'pending', injectedCase: injectedCase ? { paymentId: 'P-2299', vendor: 'Helio Freight', amount: 14750, status: 'escalated' } : null, trace, attestation: { networkCalls: 0, dataset: 'synthetic-fy26-v1', checksum: 'sha256:91c7d10ab328e04a' } }
}

function downloadJson(name: string, value: unknown) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' })); a.download = name; a.click(); URL.revokeObjectURL(a.href)
}

function EvidenceView({ decision, settings, snapshot, extraTrace = [], injectedCase = false }: { decision: string | null; settings: ReviewSettings; snapshot: RunSnapshot; extraTrace?: TraceEvent[]; injectedCase?: boolean }) {
  const packet = buildPacket(decision, settings, snapshot, extraTrace, injectedCase)
  const flagged = snapshot.fraud.truePositives + snapshot.fraud.falsePositives + (injectedCase ? 1 : 0)
  const exposure = snapshot.flaggedExposure + (injectedCase ? 14750 : 0)
  const traceCount = traceEvents.length + extraTrace.length
  return <div className="view"><div className="page-title"><div><span className="page-label"><FileCheck2 size={12} /> BOARD-READY OUTPUT</span><h2>CFO briefing & evidence packet</h2><p>A concise decision brief backed by replayable inputs, policies, evaluations, and traces.</p></div><button className="run-btn" onClick={() => downloadJson('ledgerforge-evidence-LF-260906-04.json', packet)}><Download size={15} />Download JSON packet</button></div>
    <div className="brief-grid"><main className="brief-paper panel"><div className="brief-header"><Logo /><div><span>CONFIDENTIAL · FINANCE</span><strong>06 SEP 2026</strong></div></div><hr/><span className="section-kicker">EXECUTIVE BRIEF · SEPTEMBER CLOSE</span><h1>Cash position is reconciled; {flagged} payment control{flagged === 1 ? '' : 's'} require review.</h1><p className="brief-lede">LedgerForge recommends closing August at <b>$598.4k cash</b>, placing {flagged} flagged payment{flagged === 1 ? '' : 's'} ({fmtMoney(exposure, true)}) into review, and using the downside revenue case until the Acme renewal is signed.</p>
      <div className="brief-callouts"><div><small>RECONCILED</small><strong>{Math.round(snapshot.reconciliation.recall * 100)}%</strong><span>{snapshot.reconciliation.truePositives} of 8 bank lines</span></div><div><small>CONTROL EXPOSURE</small><strong>{fmtMoney(exposure, true)}</strong><span>{flagged} payments flagged</span></div><div><small>RUNWAY</small><strong>{snapshot.runwayMonths.toFixed(1)} mo</strong><span>downside: 9.1 mo</span></div></div>
      <BriefSection number="01" title="Close recommendation"><p>Approve the cash reconciliation. Eight ledger entries map one-to-one to bank activity after applying tested alias normalization and a two-day settlement window. No residual unmatched cash remains.</p><ul><li>All match links retain source IDs and confidence.</li><li>Policy v2 achieved 100% recall with no duplicate claims.</li></ul></BriefSection>
      <BriefSection number="02" title="Immediate control actions"><p>Review the {flagged} flagged payment{flagged === 1 ? '' : 's'} pending callback verification. The configured {settings.fraudSensitivity} sensitivity and {fmtMoney(settings.materialityThreshold)} materiality threshold determine this queue; no payment is executed by the demo.</p></BriefSection>
      <BriefSection number="03" title="Decision required"><p>The October Acme renewal is not signed. Including it overstates downside runway by 2.7 months. <b>Recommended: use downside case for commitments.</b></p><div className="signature-line"><span>CFO disposition</span><strong>{decision || 'Pending CFO decision'}</strong></div></BriefSection>
      <footer><span>Generated locally by LedgerForge · Run LF-260906-04</span><span>Evidence checksum 91c7…e04a</span></footer>
    </main><aside className="packet-sidebar"><section className="panel packet-index"><span className="section-kicker">PACKET CONTENTS</span>{[['01','Executive briefing','Ready'],['02','Source manifest','Verified'],['03','Match ledger','8 rows'],['04','Control exceptions',`${flagged} rows`],['05','Policy diff','v1 → v2'],['06','Execution trace',`${traceCount} events`],['07','Evaluator report','Configured']].map(x => <div key={x[0]}><span>{x[0]}</span><strong>{x[1]}</strong><em>{x[2]}</em></div>)}</section><section className="panel attest"><ShieldCheck size={25}/><h3>Evidence attestation</h3><p>All sources are synthetic and deterministic. No external network or credentials were used.</p><div><Check size={14}/>Input checksum pinned</div><div><Check size={14}/>Policy versions retained</div><div><Check size={14}/>Rerun outcomes measured</div><div><Check size={14}/>Review settings captured</div></section></aside></div>
  </div>
}

function BriefSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) { return <section className="brief-section"><div><span>{number}</span><h2>{title}</h2></div>{children}</section> }

function ModalShell({ close, titleId, className, children }: { close: () => void; titleId: string; className: string; children: React.ReactNode }) {
  const panelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    const focusable = () => Array.from(panel?.querySelectorAll<HTMLElement>('button:not([disabled]), input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])') ?? [])
    window.setTimeout(() => focusable()[0]?.focus(), 0)
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); close(); return }
      if (event.key !== 'Tab') return
      const items = focusable(); if (!items.length) return
      const first = items[0]; const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => { document.removeEventListener('keydown', onKeyDown); window.setTimeout(() => previous?.focus(), 0) }
  }, [titleId])
  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby={titleId} onMouseDown={close}><div ref={panelRef} className={className} onMouseDown={event => event.stopPropagation()}>{children}</div></div>
}

function AboutModal({ close }: { close: () => void }) { return <ModalShell close={close} titleId="about-title" className="modal"><button className="modal-close" aria-label="Close About LedgerForge" onClick={close}><X size={18}/></button><div className="about-mark"><Logo /></div><h2 id="about-title">Finance operations you can interrogate.</h2><p>LedgerForge is a deterministic demonstration of goal-driven, tool-using finance automation. It plans work, runs local tools, measures its own output, learns from classified failures, reruns against frozen inputs, and escalates ambiguity rather than inventing certainty.</p><div className="about-grid"><div><ShieldCheck/><strong>Local by design</strong><span>No credentials or external services</span></div><div><Search/><strong>Evidence first</strong><span>Every conclusion links to a trace</span></div><div><Bot/><strong>Goal driven</strong><span>Thresholds define when work is done</span></div><div><Sparkles/><strong>Actually adaptive</strong><span>Before/after evaluation is measured</span></div></div><div className="modal-note"><b>Demo data:</b> Orbit Systems is fictional. All transactions and conclusions are synthetic and repeatable.</div><button className="run-btn full" onClick={close}>Enter console</button></ModalShell> }

function ReviewSettingsModal({ settings, onClose, onSave }: { settings: ReviewSettings; onClose: () => void; onSave: (settings: ReviewSettings) => void }) {
  const [draft, setDraft] = useState(settings)
  return <ModalShell close={onClose} titleId="settings-title" className="settings-modal"><button className="modal-close" aria-label="Close Review settings" onClick={onClose}><X size={18}/></button><span className="section-kicker"><Settings2 size={13}/> REVIEW SETTINGS</span><h2 id="settings-title">How should LedgerForge review this close?</h2><p className="settings-intro">These choices stay in this browser and are applied to the next run and its evidence.</p><label>Settlement window<select value={draft.settlementWindowDays} onChange={e => setDraft({ ...draft, settlementWindowDays: Number(e.target.value) })}><option value={0}>Same day only</option><option value={1}>Within 1 day</option><option value={2}>Within 2 days (recommended)</option><option value={3}>Within 3 days</option></select><small>Allow for normal bank settlement timing when matching entries.</small></label><label>Payment risk sensitivity<select value={draft.fraudSensitivity} onChange={e => setDraft({ ...draft, fraudSensitivity: e.target.value as ReviewSettings['fraudSensitivity'] })}><option value="low">Low — fewer alerts</option><option value="standard">Standard — balanced</option><option value="high">High — wider review queue</option></select><small>Higher sensitivity catches more unusual payments, with more items to review.</small></label><label>Materiality threshold<input type="number" min="1000" step="1000" value={draft.materialityThreshold} onChange={e => setDraft({ ...draft, materialityThreshold: Number(e.target.value) || 1000 })}/><small>Only payments at or above this threshold are eligible for the review queue.</small></label><div className="settings-actions"><button className="secondary-small" onClick={() => setDraft(DEFAULT_REVIEW_SETTINGS)}>Reset to defaults</button><button className="primary-small" onClick={() => { onSave(draft); onClose() }}>Save settings</button></div></ModalShell>
}

function OnboardingModal({ close }: { close: () => void }) { return <ModalShell close={close} titleId="onboarding-title" className="onboarding-modal"><button className="modal-close" aria-label="Close quick start" onClick={close}><X size={18}/></button><div className="onboarding-badge"><BookOpen size={17}/> QUICK START</div><h2 id="onboarding-title">Your first close review, step by step.</h2><p className="onboarding-lead">You can see the CFO story in under two minutes. Here is the only path you need.</p><ol><li><b>Run the review.</b><span>Click <strong>Run CFO Time Machine</strong> to replay the close against frozen demo data.</span></li><li><b>Read the three outcomes.</b><span>Cash, payment risk, and the runway decision are summarized in plain language.</span></li><li><b>Make the call.</b><span>Choose a downside or base case when the revenue timing is material.</span></li><li><b>Open evidence when ready.</b><span>Use Review activity, CFO Time Machine, or Board packet for the supporting record.</span></li></ol><button className="run-btn full" onClick={close}>Take me to the close</button><small className="onboarding-foot">You can reopen this guide from About LedgerForge.</small></ModalShell> }

function GoogleSignIn({ onAuthenticated }: { onAuthenticated: (session: AuthSession) => void }) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
  const [state, setState] = useState<'loading' | 'ready' | 'error'>(googleSignInAvailable(clientId) ? 'loading' : 'error')
  const [message, setMessage] = useState('')
  useEffect(() => {
    if (!clientId) return
    const initialize = () => {
      const google = (window as Window & { google?: any }).google
      if (!google?.accounts?.id) { setState('error'); setMessage('Google Identity Services did not load.'); return }
      google.accounts.id.initialize({ client_id: clientId, callback: ({ credential }: { credential: string }) => {
        const session = parseGoogleCredential(credential, clientId)
        if (!session) { setState('error'); setMessage('Google returned a credential that could not be verified for this demo.'); return }
        saveSession(localStorage, session); onAuthenticated(session)
      } })
      setState('ready')
    }
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-identity]')
    if (existing) { existing.addEventListener('load', initialize, { once: true }); if ((window as Window & { google?: any }).google) initialize(); return }
    const script = document.createElement('script'); script.src = 'https://accounts.google.com/gsi/client'; script.async = true; script.dataset.googleIdentity = 'true'; script.onload = initialize; script.onerror = () => { setState('error'); setMessage('Google sign-in could not be loaded.'); }; document.head.appendChild(script)
  }, [clientId, onAuthenticated])
  if (!googleSignInAvailable(clientId)) return null
  return <div className="google-auth"><button type="button" disabled={state !== 'ready'} onClick={() => (window as Window & { google?: any }).google?.accounts.id.prompt()}>{state === 'loading' ? 'Loading Google sign-in…' : 'Continue with Google'}</button>{message && <span role="alert">{message}</span>}</div>
}

const authSteps = [
  { title: 'Choose a CFO goal', detail: 'Pick close cash, payment risk, or runway. LedgerForge starts with a decision—not autopilot.', tag: '01 · CHOOSE' },
  { title: 'Specialists assemble', detail: 'A planner, matcher, risk reviewer, and skeptic line up around that one outcome.', tag: '02 · ASSEMBLE' },
  { title: 'Synthetic signals are inspected', detail: 'The team reads eight frozen bank lines, eight ledger entries, eight payments, and a monthly cash plan.', tag: '03 · INSPECT' },
  { title: 'Evaluate, then challenge', detail: 'Reconciliation and risk gates are measured. The skeptic catches duplicates, timing gaps, and false confidence.', tag: '04 · EVALUATE' },
  { title: 'Escalate where certainty ends', detail: 'Material ambiguity becomes a CFO question. You keep the final say on the downside or base case.', tag: '05 · ESCALATE' },
  { title: 'Improve, recheck, brief', detail: 'Only evidence-backed policy changes are rerun on the same fixtures, then packaged as a CFO briefing.', tag: '06 · BRIEF' },
]

function AuthScene({ active, onSelectStage }: { active: number; onSelectStage: (stage: number) => void }) {
  return <AuthCanvasScene active={active} onSelectStage={onSelectStage} />
}

function AuthStory() {
  const [active, setActive] = useState(1)
  const refs = useRef<Array<HTMLElement | null>>([])
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => entries.forEach(entry => { if (entry.isIntersecting) setActive(Number(entry.target.getAttribute('data-step')) + 1) }), { rootMargin: '-35% 0px -45% 0px', threshold: 0 })
    refs.current.forEach(element => element && observer.observe(element))
    return () => observer.disconnect()
  }, [])
  const jumpToStage = (stage: number) => { setActive(stage); const target = refs.current[stage - 1]; if (target) target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' }) }
  return <section className="auth-story-column" aria-label="How LedgerForge works"><header className="auth-story-hero"><span>LEDGERFORGE · AUDITABLE CLOSE REVIEW</span><h1>See how a CFO review gets from raw finance signals to a decision.</h1><p>LedgerForge runs a repeatable close review, shows its work, improves only when evidence supports it, and asks for your judgment where certainty ends.</p><p className="auth-safety">Orbit Systems and every transaction are fictional synthetic fixtures. No credentials, payments, or external network calls.</p><div className="auth-flow-rail" aria-label="Three-part review flow"><div><span>01</span><b>Inspect</b><small>read the signals</small></div><i/><div><span>02</span><b>Challenge</b><small>test the risk</small></div><i/><div><span>03</span><b>Decide</b><small>keep human control</small></div></div><a className="auth-skip-link" href="#sign-in">Skip intro and sign in <ArrowRight size={15}/></a></header><div className="auth-visual-sticky"><AuthScene active={active} onSelectStage={jumpToStage}/><p className="auth-visual-caption"><span>ONE REVIEW · SIX MOVES</span><b>From question to CFO briefing</b></p><div className="auth-progress" role="group" aria-label={`Review story progress: step ${active} of ${authSteps.length}`}>{authSteps.map((step, index) => <button key={step.title} type="button" className={index + 1 <= active ? 'filled' : ''} aria-label={`Jump to ${step.title}`} aria-current={index + 1 === active ? 'step' : undefined} onClick={() => jumpToStage(index + 1)} />)}</div></div><div className="auth-steps">{authSteps.map((step, index) => <article className={active === index + 1 ? 'auth-story-step active' : 'auth-story-step'} data-step={index} ref={element => { refs.current[index] = element }} key={step.title} tabIndex={0}><span>{step.tag}</span><h2>{step.title}</h2><p>{step.detail}</p>{index === authSteps.length - 1 && <a className="auth-stage-cta" href="#sign-in">Sign in or use the demo account <ArrowRight size={15}/></a>}</article>)}</div><div className="auth-action-note"><b>Run → inspect the trace → record the decision.</b><span>After sign-in: Run CFO Time Machine, review activity, then resolve the CFO decision.</span></div></section>
}

function DemoAuth({ onAuthenticated }: { onAuthenticated: (session: AuthSession) => void }) {
  const [email, setEmail] = useState(DEMO_EMAIL)
  const [password, setPassword] = useState(DEMO_PASSWORD)
  const [error, setError] = useState('')
  const signIn = (event: React.FormEvent) => {
    event.preventDefault()
    if (!isDemoCredential(email, password)) { setError('Use the provided demo credentials to enter the local workspace.'); return }
    const session = demoSession(); saveSession(localStorage, session); onAuthenticated(session)
  }
  const useDemo = () => { setEmail(DEMO_EMAIL); setPassword(DEMO_PASSWORD); setError(''); const session = demoSession(); saveSession(localStorage, session); onAuthenticated(session) }
  return <main className="auth-page"><div className="auth-wordmark"><Logo /><span>PRIVATE DEMO · <a href="#sign-in">SKIP TO SIGN IN</a></span></div><div className="auth-landing"><AuthStory/><section className="auth-login-column" id="sign-in"><form className="auth-card" onSubmit={signIn}><div className="auth-card-top"><div className="auth-shield"><ShieldCheck size={20} /></div><div><span>ORBIT SYSTEMS</span><h2>Sign in to LedgerForge</h2></div></div><p>Bring a little more confidence to the close. The demo is ready to run locally in your browser.</p><GoogleSignIn onAuthenticated={onAuthenticated}/><div className="auth-divider"><span>or use the local demo</span></div><label>Email<input aria-label="Email" type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" /></label><label>Password<input aria-label="Password" type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" /></label>{error && <p className="auth-error" role="alert">{error}</p>}<button className="auth-primary" type="submit">Sign in <ArrowRight size={16} /></button><button className="auth-demo" type="button" onClick={useDemo}>Use demo account</button><div className="auth-note"><ShieldCheck size={14} /><span><b>Demo authentication only</b> · no real credentials are sent or stored.</span></div></form><div className="auth-trust"><span><CheckCircle2 size={14}/> Synthetic data only</span><span><CheckCircle2 size={14}/> No external connections</span><span><CheckCircle2 size={14}/> Evidence on every answer</span></div></section></div><footer className="auth-footer"><span>© 2026 LedgerForge</span><span>Orbit Systems is fictional · local deterministic environment</span></footer></main>
}

function App() {
  const [account, setAccount] = useState<AuthSession | null>(() => loadSession(localStorage))
  const [view, setView] = useState<View>('overview')
  const [running, setRunning] = useState(false)
  const [completed, setCompleted] = useState(true)
  const [decision, setDecisionRaw] = useState<string | null>(() => localStorage.getItem('ledgerforge-decision'))
  const [about, setAbout] = useState(false)
  const [mobile, setMobile] = useState(false)
  const [agentGenerated, setAgentGenerated] = useState(false)
  const [agentImproved, setAgentImproved] = useState(false)
  const [injectedCase, setInjectedCase] = useState(false)
  const [controlMessage, setControlMessage] = useState('Ready · choose a cash, payment risk, or runway review')
  const [extraTrace, setExtraTrace] = useState<TraceEvent[]>([])
  const [history, setHistory] = useState<CfoHistoryRecord[]>(() => account ? getHistory(localStorage, account) : [])
  const [reviewSettings, setReviewSettings] = useState<ReviewSettings>(() => loadReviewSettings(localStorage))
  const configuredSnapshot = useMemo(() => createSnapshot('improved', reviewSettings), [reviewSettings])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [dataMessage, setDataMessage] = useState('Synthetic demo data ready')
  const [onboarding, setOnboarding] = useState(() => localStorage.getItem('ledgerforge-onboarding-seen') !== '1')
  useEffect(() => { if (!mobile) return; const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setMobile(false) }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey) }, [mobile])
  const setDecision = (v: string) => { setDecisionRaw(v || null); if (v) localStorage.setItem('ledgerforge-decision', v); else localStorage.removeItem('ledgerforge-decision') }
  const addHistory = (record: CfoHistoryRecord) => { if (account) setHistory(appendHistory(localStorage, account, record)) }
  const run = () => { setRunning(true); setCompleted(false); setView('overview'); const matches = configuredSnapshot.reconciliation.truePositives; const flagged = configuredSnapshot.fraud.truePositives + configuredSnapshot.fraud.falsePositives; setControlMessage(`Review complete · ${matches}/8 cash links · ${flagged} payment alerts · settings applied`); window.setTimeout(() => { setRunning(false); setCompleted(true); addHistory({ id: `LF-${Date.now()}`, date: 'Just now', title: 'CFO Time Machine replay', score: Math.min(99, 88 + matches + flagged), status: 'reviewed', evidence: 'Board packet updated', activity: 'Close rechecked' }); setView('time-machine') }, 1450) }
  const addControlTrace = (event: TraceEvent) => setExtraTrace(prev => [...prev, event])
  const generateAgent = () => { setAgentGenerated(true); setControlMessage('Review team ready · three CFO paths assembled'); addControlTrace({ id: 'T12', time: '09:42:31', phase: 'plan', title: 'Review team assembled', detail: 'Compiled close, controls, and runway workflows from deterministic local policies.', tool: 'agent.generate_local', status: 'success', durationMs: 12 }) }
  const improveAgent = () => { setAgentImproved(true); setControlMessage('Agent improved · policy v2 verified against the frozen fixture'); addControlTrace({ id: 'T13', time: '09:42:44', phase: 'improve', title: 'Agent improvement applied', detail: 'Promoted alias, settlement-window, and duplicate-cluster signals after evaluator evidence.', tool: 'agent.improve_local', status: 'success', durationMs: 19 }) }
  const injectFraud = () => { setInjectedCase(true); setControlMessage('Fraud case escalated · P-2299 Helio Freight · $14,750'); addControlTrace({ id: 'T14', time: '09:42:57', phase: 'escalate', title: 'Synthetic fraud case injected', detail: 'P-2299 Helio Freight · $14,750 · duplicate bank account and new vendor signals.', tool: 'fixture.inject_fraud', status: 'warning', durationMs: 4 }); addHistory({ id: `LF-injected-${Date.now()}`, date: 'Just now', title: 'Injected payment review', score: 94, status: 'attention', evidence: 'Review activity saved', activity: 'New risk escalated' }) }
  const loadData = () => { clearDemoData(localStorage); setDecision(''); setHistory(account ? getHistory(localStorage, account) : []); setInjectedCase(false); setAgentGenerated(false); setAgentImproved(false); setExtraTrace([]); setDataMessage('Synthetic demo data reloaded · stale run state cleared'); setControlMessage('Ready · choose a cash, payment risk, or runway review') }
  const saveSettingsAndApply = (next: ReviewSettings) => { saveReviewSettings(localStorage, next); setReviewSettings(next); setControlMessage(`Settings saved · ${next.settlementWindowDays}d matching window · ${next.fraudSensitivity} payment sensitivity`) }
  const reset = () => { setDecision(''); setView('overview'); setCompleted(true); setAbout(false); setAgentGenerated(false); setAgentImproved(false); setInjectedCase(false); setControlMessage('Ready · choose a cash, payment risk, or runway review'); setExtraTrace([]) }
  const title = useMemo(() => ({ overview: 'Command center', timeline: 'Execution trace', 'time-machine': 'Time Machine', evidence: 'Evidence packet' })[view], [view])
  const signOut = () => { localStorage.removeItem(SESSION_KEY); setAccount(null); setHistory([]); setMobile(false); setAbout(false) }
  const authenticate = (session: AuthSession) => { setAccount(session); setHistory(getHistory(localStorage, session)) }
  if (!account) return <DemoAuth onAuthenticated={authenticate} />
  return <div className={`app-shell ${mobile ? 'mobile-open' : ''}`}>
    <div className="mobile-overlay" onClick={() => setMobile(false)} />
    <Sidebar view={view} setView={(v) => { setView(v); setMobile(false); document.title = `${title} — LedgerForge` }} openAbout={() => setAbout(true)} signOut={signOut} account={account} openSettings={() => setSettingsOpen(true)} loadData={loadData} dataMessage={dataMessage} />
    <main className="content"><Header running={running} run={run} reset={reset} mobileNav={() => setMobile(v => !v)} mobileOpen={mobile} />
      {view === 'overview' && <Overview setView={setView} decision={decision} setDecision={setDecision} completed={completed} running={running} run={run} agentGenerated={agentGenerated} agentImproved={agentImproved} injectedCase={injectedCase} controlMessage={controlMessage} onGenerate={generateAgent} onImprove={improveAgent} onInject={injectFraud} history={history} account={account} snapshot={configuredSnapshot} settings={reviewSettings} />}
      {view === 'timeline' && <TimelineView extraTrace={extraTrace} />}
      {view === 'time-machine' && <TimeMachineView settings={reviewSettings} />}
      {view === 'evidence' && <EvidenceView decision={decision} settings={reviewSettings} snapshot={configuredSnapshot} extraTrace={extraTrace} injectedCase={injectedCase} />}
    </main>
    {about && <AboutModal close={() => setAbout(false)} />}
    {settingsOpen && <ReviewSettingsModal settings={reviewSettings} onClose={() => setSettingsOpen(false)} onSave={saveSettingsAndApply} />}
    {onboarding && <OnboardingModal close={() => { localStorage.setItem('ledgerforge-onboarding-seen', '1'); setOnboarding(false) }} />}
  </div>
}

export default App
