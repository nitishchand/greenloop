---
description: Phase 5 (build) — the green loop for one task; machine-gated by greenloop-verify exit 0.
argument-hint: <task-id>
---

You are in the **build** phase for task `$ARGUMENTS`. Use the `greenloop-feature` skill — it
defines the green loop (Plan → Implement → Author E2E → Verify → Self-correct → Checkpoint)
and its anti-reward-hacking rules.

The only done-signal is `greenloop-verify $ARGUMENTS` exiting **0**, followed by the checkpoint
(diff review, commit, `active: false`). If no task id was given, list the tasks in
`progress.json` and ask which one.
