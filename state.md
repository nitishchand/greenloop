# Breathe-and-Build — Project State

**Last updated:** 2026-07-08
**Repo:** `/Users/nitishchand/codebase/breathe-and-build` (local only — no GitHub remote yet)

## What is this

Open-source spec-to-verified-app system for Claude Code (npx installer + plugin), codifying the
ClinicBuddy build methodology. Design spec: `docs/specs/2026-07-08-breathe-and-build-design.md`
(approved). Implementation split into 4 plans; plan docs live in `docs/plans/`.

## Status by plan

- ✅ **Plan 1 — Core engine** (`docs/plans/2026-07-08-01-core-engine.md`, merged to main 2026-07-08):
  zero-dep Node ESM package, 27 tests green (`npm test`).
  CLIs: `bnb-verify` (green gate, exit 0/1/3/9, sole writer of `passes`), `bnb-doctor`
  (fix-it list, exit 0/3), `bnb-loop` (headless laps via `claude -p`), `bnb-stop-hook`
  (blocks stop while active task red; escape = `abandoned:true`).
  Contracts documented in README.md — Plans 2–4 build on them; do not change without care.
- 🔲 **Plan 2 — Plugin**: `.claude-plugin` manifest, `commands/bnb/*` (status router + idea/prd/
  architecture/scaffold/feature/overnight/doctor), self-contained skills (bnb-prd gap-hunting
  loop, bnb-architecture, bnb-feature green loop, bnb-debugging, bnb-overnight), artifact
  templates (prd.md screen-spec format, state.md, debug.md, spiritual-guide.md, CLAUDE.md).
  Plan not yet written — use writing-plans against spec §4–§6.
- 🔲 **Plan 3 — expo-react-native profile**: scaffold templates (Expo+Express+Prisma monorepo,
  docker-compose), verifier/doctor config, toolbelt + conventions docs. Spec §7.
- 🔲 **Plan 4 — Installer + MiniClinic demo + CI dogfood + playbook docs.** Spec §3, §10–§12.

## Conventions

- Plain Node >= 20 ESM, zero runtime deps, `node --test` (no jest). No build step.
- Pure logic in `src/` with injectable `exec`/`log`; `bin/` are thin wrappers. TDD per plan docs.
- Work on a `plan-N-*` branch, merge to main when green.
- `bossPrompt()` in `src/core/loop.js` is exported for Plan 2's overnight skill to reuse.
