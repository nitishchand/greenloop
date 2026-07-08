---
name: bnb-feature
description: "The green loop for one task — Plan, Implement, Author E2E, Verify with bnb-verify, Self-correct via subagent investigation, Checkpoint. Machine-gated: done means exit 0, with anti-reward-hacking rules enforced structurally."
---

# bnb-feature — the green loop

## Hard rules

1. **Never edit `passes`** in `progress.json` — `bnb-verify` is its sole writer. The only
   evidence of green is `bnb-verify <task-id>` exiting **0**; quote the exit code.
2. **Never weaken the verifier or an E2E flow** to force a pass. Deleting assertions,
   loosening waits, or editing `bnb.config.json` mid-loop is reward hacking and will show
   in the checkpoint diff review.
3. **Commit the flow before chasing green** (step 3). Any later weakening of it appears in
   the diff, on purpose.
4. Investigation of failures is **delegated to a subagent** — the main loop applies fixes
   but does not spelunk logs itself (token economy).

## The loop

1. **Plan** — write the task into `progress.json`: `spec`, `acceptance[]`, `testIDs[]`
   (from the PRD's S-NN block), `flow` path per the profile's conventions doc. Set
   `active: true` — this arms the Stop hook: you cannot end the session while this task
   is red (escape hatch: `abandoned: true`, a recorded decision).
2. **Implement** — follow the profile's conventions; add **every** declared testID.
   **See it render**: screenshot via the profile toolbelt. A blank/black screen is a crash,
   not done.
3. **Author the E2E flow first** — inspect the live view tree (toolbelt), confirm the
   testIDs are present, write the flow covering every `acceptance[]` item, then
   **commit the flow** before any green-chasing.
4. **Verify** — run `bnb-verify <task-id>`. Read the exit code and the failing tail.
   Exit 3 = environment, run `bnb-doctor`, fix, retry — not a code failure.
5. **Self-correct** — spawn an investigation subagent with: the task's spec/acceptance/
   testIDs, the failing tail, and prior `reflexions[]`. It returns hypothesis + evidence
   excerpt + suggested fix in ≤250 words and **never edits files**. Append a Reflexion
   entry (`symptom`, `hypothesis`, `fix`) to the task, apply the fix to the FEATURE
   yourself, go to step 4.
6. **Checkpoint** — after exit 0: review the full diff (this doubles as the tamper check —
   verifier and flows unchanged since step 3), commit, set `active: false`, update
   `state.md`, and append to `debug.md` if something non-obvious was learned.

## Red flags

| Thought | Reality |
|---|---|
| "Unit tests pass, so it's done" | Done = bnb-verify exit 0, which includes the E2E layer. |
| "I'll tweak the flow so it passes" | That's reward hacking. Fix the feature, not the test. |
| "The screen probably renders" | Screenshot it. Blank/black = crash, not done. |
| "Context is long, let me wrap up" | Reset instead: fresh session, resume from progress.json. |
| "I'll just set passes: true" | You never write `passes`. Only bnb-verify does. |
| "Verify is flaky, third try counts" | A pass that needs retries is evidence of a real bug. Investigate (step 5). |
