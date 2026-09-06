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

## Local demo sign-in

LedgerForge opens on a local demo authentication screen before the CFO console. Use either **Sign in** or **Use demo account** with the prefilled credentials:

- **Email:** `cfo@orbitsystems.demo`
- **Password:** `ledgerforge`

This is a UX-only local gate: no real credential is sent, stored, or validated remotely. The browser stores only a local demo-session flag so a refresh keeps the workspace open; use **Sign out** in the sidebar to clear it.

The sign-in page is also a short, skippable product tour: scroll through the six review moves (choose a goal, assemble specialists, inspect synthetic signals, evaluate/challenge, escalate ambiguity, then improve and brief). The sticky visual is decorative and collapses to readable step cards for mobile or reduced-motion users. The final card links directly to **Sign in** / **Use demo account**.

Once inside, follow the friendly path **Run CFO Time Machine → Review activity → record the CFO decision**. **Demo data** reloads the frozen Orbit Systems fixtures and clears stale local run state with a visible confirmation. **Review settings** opens a local panel where you can change settlement window, payment sensitivity, and materiality; saved settings are applied on the next rerun and can be reset to defaults.

### Optional Google sign-in

LedgerForge can use [Google Identity Services](https://accounts.google.com/gsi/client) when a public browser OAuth client ID is configured. It is intentionally **hidden** in the public demo until `VITE_GOOGLE_CLIENT_ID` is provided; the local demo remains fully usable and no dead Google control is shown.

1. Create a Google OAuth **Web application** client in Google Cloud and add your deployed Pages origin (`https://vanshx999.github.io`) to Authorized JavaScript origins.
2. In GitHub, open **Settings → Secrets and variables → Actions → Variables** and add repository variable `VITE_GOOGLE_CLIENT_ID` with the client ID. A client ID is public configuration, not a client secret—never add a secret to this static app.
3. Re-run the Pages workflow. The workflow passes that variable to Vite at build time.

The static client decodes the Google Identity Services credential only after its callback, then checks audience, expiry, and verified-email claims before storing a local display session. It cannot perform cryptographic token-signature verification without a backend; production financial use should exchange the credential with a server that verifies the ID token and creates an HttpOnly session.

## Your CFO history

After sign-in, the overview includes **Your CFO history**. It is transparently stored only in browser `localStorage`, keyed to the signed-in account. The demo account starts with sensible synthetic history; new Google accounts start empty and receive records after a Time Machine replay or injected fraud review. These history entries are not cloud backups or authoritative accounting records.

## Five-minute demo flow

1. Sign in with the local demo account, then open **Command center**. The seeded run is already complete so the story is visible immediately.
2. Click **Run CFO Time Machine** to replay the same close review. The three selectable CFO questions are *Close cash position*, *Surface payment risk*, and *Protect operating runway*.
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

All names, amounts, dates, and conclusions are fictional. LedgerForge never sends data over the network, never executes payments, and never replaces CFO approval for the escalated revenue assumption. The reset action only clears the browser's local decision state. The reference fixture contains 8 bank lines, 8 ledger entries, 8 payments, and a monthly cash plan; headline demo results are 8/8 reconciled, 3 payment flags with $44.6k held for review, and 11.8 months of runway (+2.7 months of buffer). Recall means known-case coverage, precision means how many flags were real, and exposure is dollars to review—not confirmed loss.
