# Playbook: running BnB economically

Token economy is a first-class goal (spec §10). The system enforces most of it structurally;
this is the operator's side.

## What the structure already does

- **Failing-tail discipline**: `bnb-verify` writes full logs to `.bnb/results/<task>/` and
  prints only the failing tail (default 40 lines). The agent reads a scalpel, not a haystack.
- **Subagent-capped investigation**: debugging skills delegate log-spelunking to subagents
  that return ≤250-word conclusions. Streams (Metro, backend) get a log-watcher subagent
  returning anomalies only.
- **Structured resume**: `progress.json` + `state.md` + `debug.md` mean a fresh session
  rebuilds context in one read. When context grows long, the skills say: reset and resume —
  never degrade in place.

## Watch your spend

- Install [ccusage](https://github.com/ryoppippi/ccusage) and check per-session burn;
  overnight runs deserve a morning `ccusage` glance alongside the diff review.
- Set up a statusline (`/statusline` in Claude Code) showing model + context size — the
  "context is long, let me wrap up" red flag is visible before it bites.

## Model strategy

Route routine implementation laps to a cheaper model and save the strongest model for hard
debugging sessions. With `bnb-loop`, set the model per run (`claude -p` inherits your
configured default; use `/model` interactively). The loop's lap structure makes this cheap
to change per task.

## Cache-friendly cadence

Anthropic's prompt cache has a short TTL: keep verify-fix-verify iterations tight rather
than wandering between tasks, and let `bnb-loop` laps run back-to-back — a lap that pauses
for minutes pays the cache miss on resume. Batch artifact reads (state.md + debug.md +
progress.json at session start, as CLAUDE.md instructs) so they land in one cached prefix.
