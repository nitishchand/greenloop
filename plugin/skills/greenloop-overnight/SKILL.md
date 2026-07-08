---
name: greenloop-overnight
description: Unattended boss-prompt mode — queue tasks, launch headless greenloop-loop laps with the restricted allowlist, resolve every open question from spiritual-guide.md, and run the mandatory wake-up ritual before trusting any result.
---

# greenloop-overnight — unattended runs

## Hard rules

1. **Never wait on the user.** During the run, every ambiguous decision is resolved by
   consulting `spiritual-guide.md` (the answer-of-last-resort oracle) and picking the answer
   most consistent with it. Record each such decision as a Reflexion on the task. If the
   guide is empty/unfilled, refuse to start the overnight run.
2. **Nothing from an overnight run is trusted until the wake-up ritual completes.** A
   printed "DONE" or a green-looking transcript is a claim, not evidence.
3. The run uses the curated allowlist from `greenloop.config.json` (`loop.allowedTools`) — never
   `--dangerously-skip-permissions`.
4. The outer wall-clock timeout is the caller's job: always launch as
   `timeout 30m greenloop-loop <task-id> [max-laps]` (macOS: `brew install coreutils`, then `gtimeout`).

## Setting up the run

1. For each requested task: ensure a complete entry in `progress.json` (`spec`,
   `acceptance[]`, `testIDs[]`, `flow`) and set `active: true`. Incomplete specs don't run
   overnight — the loop can't ask anyone.
2. Confirm `spiritual-guide.md` is filled in by the user (rule 1).
3. Run `greenloop-doctor`; exit 3 → fix the environment first. An overnight run into a broken
   env burns every lap.
4. Launch per task, sequentially: `timeout 30m greenloop-loop <task-id> 20` (macOS: `gtimeout` from coreutils). The loop runs
   `claude -p` laps gated by `greenloop-verify`; exit 0 = green, 1 = max laps without green.

## The wake-up ritual (mandatory, in order)

1. **Review the full diff** since the pre-run commit — this is the tamper check: verifier
   config and E2E flows must not have been weakened; `passes` must not have been hand-set.
2. **Re-run `greenloop-verify <task-id>` yourself** for every task the run claims green. Only
   this fresh exit 0 counts.
3. Read the new `reflexions[]` and any `spiritual-guide.md`-based decisions; confirm you
   agree with them; promote lessons to `debug.md`/`state.md`.
4. Only then: checkpoint (commit, `active: false`) or send red tasks back to `/greenloop:feature`.

## Red flags

| Thought | Reality |
|---|---|
| "The transcript says DONE" | Claims aren't evidence. Wake-up ritual: diff + fresh greenloop-verify. |
| "Tests pass, skip the diff review" | The diff review is the tamper check. It is never optional. |
| "The loop should ask the user about this" | It's 3am — that's what spiritual-guide.md is for. Unresolvable = don't queue it. |
| "Bypass permissions, it's unattended anyway" | The curated allowlist is the design. No bypass. |
| "Queue all 12 tasks" | Overnight capacity is a few well-specified tasks; a vague task burns 20 laps. |
