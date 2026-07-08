# {{PROJECT_NAME}}

Built with GreenLoop ({{PROFILE}} profile).

## Session start — always

1. Read `state.md` (project state) and `debug.md` (bug ledger) before touching code.
2. `progress.json` is the structured resume artifact — resume from it instead of
   re-deriving context. If context grows long, start a fresh session and resume.
3. Check the LAN-IP / env assumptions listed in state.md gotchas before running the app.

## The green gate

- A feature is done when `greenloop-verify <task-id>` exits **0** — not when unit tests pass,
  not when the screen "looks right". Exit codes: 0 green · 1 red · 3 env not ready
  (run `greenloop-doctor`) · 9 unknown task.
- `passes` in `progress.json` is written **only** by `greenloop-verify`. Never edit it by hand.
- Never weaken the verifier config or an E2E flow to force a pass — that is reward
  hacking and it shows in the checkpoint diff review.

## Working rules

- Follow the profile's `toolbelt.md` (how to launch, read logs, screenshot, dump the view
  tree) and `conventions.md` (testID naming, where flows live).
- Commit only after verified green; the commit includes the E2E flow.
- Update `state.md` at every checkpoint; append to `debug.md` after every root-cause fix.
