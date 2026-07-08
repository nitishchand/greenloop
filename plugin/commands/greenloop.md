---
description: Status router — tells you which GreenLoop phase you are in and the next command. Never starts work itself.
---

Determine the project's current GreenLoop phase and report it. Do NOT begin any phase's work.

1. Read `state.md`, `prd.md`, and `progress.json` in the project root (each may not exist).
2. Determine the phase, first match wins:
   - No `prd.md` → phase **idea**, next `/greenloop:idea`.
   - `prd.md` exists but its Status line is not `final` → phase **prd**, next `/greenloop:prd`.
   - No approved "Architecture decisions" section in `state.md` → phase **architecture**, next `/greenloop:architecture`.
   - No `greenloop.config.json` (project not scaffolded) → phase **scaffold**, next `/greenloop:scaffold`.
   - Otherwise → phase **build**: list tasks from `progress.json` (id, active, passes, abandoned); next `/greenloop:feature <task-id>` (or `/greenloop:overnight <task-ids>` for unattended runs).
3. Output exactly this shape, then stop:

> You are in **<phase>**. Next: `/greenloop:<command>`.
> <one line of context: what remains to close this phase>

If the environment looks broken at any point, suggest `/greenloop:doctor` — do not diagnose inline.
