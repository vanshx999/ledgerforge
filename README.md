# LedgerForge

LedgerForge is a polished, local-only Vite + React + TypeScript CFO console. It demonstrates a goal-driven finance agent that plans work, calls deterministic local tools, records a trace, classifies deliberate failures, improves its policy, measures the rerun, and escalates an ambiguous decision to a human.

## Run it

```bash
npm install
npm run dev       # open the Vite URL shown in the terminal
npm test          # deterministic domain tests
npm run build     # type-check + production bundle
```

No API keys, database, network service, or external credentials are required. The synthetic Orbit Systems fixtures are checked into `src/data.ts`.

## Five-minute demo flow

1. Open **Command center**. The seeded run is already complete so the story is visible immediately.
2. Click **Run all goals** to replay the run. The three goal contracts are *Close cash position*, *Surface payment risk*, and *Protect operating runway*.
3. Read **Policy changed. Outcomes improved.** The before/after cards are measured from the same frozen inputs, not invented progress.
4. Open **Execution trace**. Filter `failure`, `improve`, or `evaluate` to see the exact tool calls, deliberate failures, classifications, policy patch, and evaluator gates.
5. Open **Time Machine** to compare v1/v2 row by row. The reconciliation view explains why aliases, a ±2 day settlement window, and duplicate-cluster signals fixed the misses.
6. Resolve the **CFO decision** card (downside or base case), then open **Evidence packet** and download the JSON packet. It includes the briefing, source manifest, policies, results, escalation, and trace.
7. Use the refresh icon in the header to reset the local decision, or **About LedgerForge** in the sidebar for the architecture and safety posture.

## Architecture

- `src/data.ts` — deterministic synthetic bank, ledger, payment, vendor alias, and runway fixtures.
- `src/engine.ts` — local tools (`matchTransactions`, `detectFraud`), evaluators, failure classification, escalation, snapshots, and trace events.
- `src/App.tsx` — responsive serious-CFO console: command center, execution trace, Time Machine, and board-ready evidence packet.
- `src/engine.test.ts` — matching, fraud, metrics/evaluation, improvement, failure classification, and ambiguity escalation tests.

The “agent” is intentionally transparent: every outcome is a pure function of the fixtures and a named policy version. v1 is intentionally too strict and misses aliases, settlement drift, and a coordinated duplicate pattern. v2 applies targeted changes and reruns against identical inputs. This makes the self-improvement claim reproducible offline.

## AO / Neatlogs notes

This repository is designed for an AO desktop demo: keep the Vite dev process in the session workspace and use the AO Browser panel to inspect the responsive console. The UI does not require a hosted backend. For Neatlogs-style observability, the **Execution trace** is the local equivalent: each event carries an ID, timestamp, phase, tool name, status, detail, duration, and a sealed checksum in the manifest. Exporting the evidence packet gives a portable JSON artifact suitable for attaching to a run or review.

## Data and safety

All names, amounts, dates, and conclusions are fictional. LedgerForge never sends data over the network, never executes payments, and never replaces CFO approval for the escalated revenue assumption. The reset action only clears the browser's local decision state.
