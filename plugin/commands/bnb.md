---
description: Status router — tells you which BnB phase you are in and the next command. Never starts work itself.
---

Determine the project's current BnB phase and report it. Do NOT begin any phase's work.

1. Read `state.md`, `prd.md`, and `progress.json` in the project root (each may not exist).
2. Determine the phase, first match wins:
   - No `prd.md` → phase **idea**, next `/bnb:idea`.
   - `prd.md` exists but its Status line is not `final` → phase **prd**, next `/bnb:prd`.
   - No approved "Architecture decisions" section in `state.md` → phase **architecture**, next `/bnb:architecture`.
   - No `bnb.config.json` (project not scaffolded) → phase **scaffold**, next `/bnb:scaffold`.
   - Otherwise → phase **build**: list tasks from `progress.json` (id, active, passes, abandoned); next `/bnb:feature <task-id>` (or `/bnb:overnight <task-ids>` for unattended runs).
3. Output exactly this shape, then stop:

> You are in **<phase>**. Next: `/bnb:<command>`.
> <one line of context: what remains to close this phase>

If the environment looks broken at any point, suggest `/bnb:doctor` — do not diagnose inline.
