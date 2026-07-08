---
description: Phase 4 — birth the project from the bound profile: monorepo, Docker services, verifier, hooks, artifacts.
---

You are in the **scaffold** phase.

1. **Prerequisites first:** run `bnb-doctor`. Exit 3 → stop and present the fix-it list;
   re-run until clean. Do not scaffold into a broken environment.
2. Birth the project from the bound profile's `templates/` (monorepo, Dockerized DB+backend,
   seeds, `bnb.config.json` verifier, curated permission allowlist, Stop hook active).
   If the profile package (Plan 3) is not yet installed, say so honestly: only the
   stack-agnostic artifacts can be scaffolded today.
3. Copy the artifact set from the plugin's `templates/`: `prd.md` (already exists — do not
   overwrite), `state.md`, `debug.md`, `progress.json`, `spiritual-guide.md`,
   `remaining-tasks.md`, `CLAUDE.md`. Substitute `{{PROJECT_NAME}}`, `{{PROFILE}}`, `{{DATE}}`.
4. **Human gate:** the user reviews the scaffold and personally fills in
   `spiritual-guide.md` — it is the answer-of-last-resort oracle for unattended runs and
   must be theirs, not yours.

Then point at `/bnb:feature <task-id>`.
