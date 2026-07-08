---
name: bnb-debugging
description: Systematic debugging tuned to the green loop — evidence before hypothesis, investigation delegated to subagents with capped summaries, debug.md read first and cited ("see Bug 8"), every root-cause fix appended to the ledger.
---

# bnb-debugging — evidence before hypothesis

## Hard rules

1. **Read `debug.md` first.** If the symptom resembles a ledger entry, cite it
   ("see Bug 8") and try its lesson before any new investigation.
2. **Evidence before hypothesis.** No fix is applied until there is an observed cause: a
   log line, a failing assertion, a view-tree dump. "It's probably X" is not evidence.
3. **Delegate investigation to a subagent.** It gets: the symptom, the failing tail, the
   task's spec/acceptance/testIDs, prior `reflexions[]`, and relevant `debug.md` entries.
   It returns hypothesis + evidence excerpt + suggested fix, **≤250 words, no file edits**.
   Raw logs stay out of the main context — that is the point (token economy).
4. **Every root-cause fix gets a ledger entry.** Append `## Bug N` to `debug.md` with
   Symptom / Root cause / Fix / Lesson. In-loop fixes also get a Reflexion in
   `progress.json`. A fix without a Lesson is not done.

## Process

1. Reproduce or capture the failure (failing tail from `bnb-verify`, toolbelt logs,
   screenshot). One concrete artifact minimum.
2. Check `debug.md` for a matching symptom; apply and verify the cited lesson if found.
3. Otherwise spawn the investigation subagent (rule 3) — one hypothesis at a time.
4. Apply the suggested fix yourself; re-run `bnb-verify` (or the narrowest failing layer)
   to confirm the evidence chain: symptom gone for the stated reason, not coincidentally.
5. Record: Reflexion entry now; `debug.md` entry at root cause.

## Red flags

| Thought | Reality |
|---|---|
| "Fixed it, not sure why it broke" | Then it isn't fixed — find the root cause or record it as open. |
| "Same symptom as Bug 6, but let me investigate fresh" | Read Bug 6 first. The ledger exists to be cited. |
| "Let me paste the whole log here" | 300 lines of logs in context is the anti-pattern. Subagent, capped summary. |
| "Two or three hypotheses at once" | One at a time, each with evidence, or the signal blurs. |
| "It works now, no ledger entry needed" | Future sessions rediscover unrecorded bugs. Append the entry. |
