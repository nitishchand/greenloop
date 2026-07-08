# Tutorial: idea → verified app with GreenLoop

This walkthrough builds **MiniClinic** — a patient check-in list, the same app committed at
[`demo/miniclinic`](../demo/miniclinic) — so you can diff your result against the canonical
one at every step.

## 0. Install

```bash
npx greenloop
```

The installer preflights Claude Code, Node ≥ 20, Docker, Xcode + iOS Simulator, and Maestro.
It auto-installs only Maestro (with your confirmation); for everything else it prints exact
instructions and re-checks until green — it never half-installs. Then it registers the `greenloop`
plugin and the Expo MCP server (`/mcp` in your next session to authenticate). Use
`npx greenloop --check` any time for a report-only preflight.

## 1. Plan: `/greenloop:idea`

Open Claude Code in an empty directory and run `/greenloop` — it tells you you're in the idea
phase. `/greenloop:idea` is a free-form conversation: describe the receptionist, the queue at the
desk, the one job (add a patient, see the list). It ends with a `prd.md` v0 draft you
confirm.

## 2. Plan: `/greenloop:prd` — the gap-hunting loop

Claude reads the entire PRD, hunts gaps, and asks about them **one at a time**. MiniClinic's
committed PRD shows a real pass: three gaps (empty state, error behaviour, data reset
semantics), answered and folded back in, then `pass 2 — gaps found: 0` and you declare it
final. Every screen leaves this phase with `testIDs[]` — E2E-ready by construction.

## 3. Plan: `/greenloop:architecture`

Claude presents the DB schema, API surface (`GET/POST /patients`), and offline strategy for
you to challenge, then confirms the stack (default: expo-react-native). Approval lands in
`state.md`.

## 4. `/greenloop:scaffold`

Runs `greenloop-doctor` first (fix-it list until clean), then births the monorepo from the profile
templates plus the artifact set. You personally fill in `spiritual-guide.md` — it's the
agent's answer-of-last-resort during unattended runs.

## 5. Build: `/greenloop:feature s01-patient-list`

The green loop: plan into `progress.json` (arming the Stop hook) → implement, screenshot to
prove it renders → author the Maestro flow and **commit it before chasing green** → then:

```
greenloop-verify s01-patient-list
✓ green — all layers passed for 's01-patient-list'   # exit 0
```

Exit 1 → the failing tail is the evidence, a subagent investigates, a Reflexion is recorded,
fix, retry. Exit 3 → environment, not code: run `greenloop-doctor`. The session cannot end while
the task is red — that's the Stop hook.

## 6. Overnight variant

`/greenloop:overnight s02-...` queues well-specified tasks and launches
`timeout 30m greenloop-loop <task> 20` laps. In the morning, the wake-up ritual: review the full
diff, re-run `greenloop-verify` yourself. Only a fresh exit 0 counts.
