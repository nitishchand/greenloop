# GreenLoop — Project State

**Last updated:** 2026-07-09
**Repo:** https://github.com/nitishchand/greenloop (pushed 2026-07-09; CI unit gate green).
Local dir `/Users/nitishchand/codebase/breathe-and-build` — name predates the rename; renaming
the folder is optional and safe.

## What is this

Open-source spec-to-verified-app system for Claude Code (npx installer + plugin), codifying the
ClinicBuddy build methodology. Design spec: `docs/specs/2026-07-08-greenloop-design.md`
(approved). Implementation split into 4 plans; plan docs live in `docs/plans/`.

## Naming

Renamed 2026-07-09: **breathe-and-build / bnb → GreenLoop / greenloop**, one name everywhere
(package, plugin, marketplace, CLIs `greenloop-*`, `/greenloop:*` commands, `greenloop.config.json`,
`.greenloop/` results dir, `greenloop-*` skills). Done pre-publish, so nothing external references
the old name. Plan docs in `docs/plans/` keep the old names as historical record (header note in
each); the design spec was updated as a living doc. npm names `greenloop`/`green-loop` were
unclaimed as of 2026-07-09.

## Status by plan

- ✅ **Plan 1 — Core engine** (`docs/plans/2026-07-08-01-core-engine.md`, merged to main 2026-07-08):
  zero-dep Node ESM package, 27 tests green (`npm test`).
  CLIs: `greenloop-verify` (green gate, exit 0/1/3/9, sole writer of `passes`), `greenloop-doctor`
  (fix-it list, exit 0/3), `greenloop-loop` (headless laps via `claude -p`), `greenloop-stop-hook`
  (blocks stop while active task red; escape = `abandoned:true`).
  Contracts documented in README.md — Plans 2–4 build on them; do not change without care.
- ✅ **Plan 2 — Plugin** (`docs/plans/2026-07-08-02-plugin.md`, merged to main 2026-07-08):
  plugin name `greenloop` (`plugin/.claude-plugin/plugin.json`), repo-root marketplace
  (`.claude-plugin/marketplace.json`, install: `claude plugin install greenloop@greenloop`),
  8 flat commands in `plugin/commands/` (`/greenloop` router + idea/prd/architecture/scaffold/
  feature/overnight/doctor), 5 skills, 7 artifact templates, self-contained Stop hook
  (`plugin/hooks/verify-before-stop.js`, parity-tested vs `greenloop-stop-hook`). 54 tests green;
  `claude plugin validate` clean. Resolved spec §15 Q1 (packaging) + Q3 (spiritual-guide
  prompts). NOTE: skill/command frontmatter descriptions with a colon must be quoted
  (YAML) — guarded by test.
- ✅ **Plan 3 — expo-react-native profile** (`docs/plans/2026-07-08-03-expo-react-native-profile.md`,
  merged to main 2026-07-08): `profiles/expo-react-native/` — verifier.json (tsc→jest→maestro
  + backend/simulator/metro preflights), doctor.json (7 checks incl. accessibility reminder),
  toolbelt.md, conventions.md, scaffold templates (Expo+Express+Prisma npm-workspaces monorepo,
  docker-compose ×3 `unless-stopped`, curated allowlist settings.json). `loadConfig` now merges
  profile verifier/doctor under project overrides (project key wins WHOLESALE; unknown profile
  throws). Template dep versions unverified until MiniClinic runs (Plan 4).
- ✅ **Plan 4 — Installer + MiniClinic + CI + docs** (`docs/plans/2026-07-08-04-installer-demo-ci-docs.md`,
  merged to main 2026-07-08): scaffold engine (`src/core/scaffold.js`, `{{VAR}}` substitution,
  never overwrites), `npx greenloop` installer (preflight loop, only Maestro
  auto-installs, `--check`/`--yes`, registers plugin + Expo MCP), `demo/miniclinic`
  (scaffold + 2 screens + patients endpoint + flow; no-drift test vs templates),
  `.github/workflows/ci.yml` (unit gate ubuntu+macos × node 20/22; dogfood job
  dispatch-only), docs set (tutorial/playbook/os-matrix/writing-profiles/container-mode).
  Resolved spec §15 Q2: Metro MCP folds into Expo MCP (`claude mcp add --transport http
  expo https://mcp.expo.dev/mcp` + `expo-mcp` dev dep + `EXPO_UNSTABLE_MCP_SERVER=1`);
  Fetch MCP dropped (built-in WebFetch). 95 tests green.

## v1 status — feature-complete, pre-release

All four plans merged. Remaining steps are human/external:

1. Create the GitHub repo (`nitishchand/greenloop`) and push — unlocks the CI unit
   gate and makes the marketplace installable by URL.
2. `npm publish` — makes `npx greenloop@latest` real.
3. Dogfood: 7 CI runs on 2026-07-08/09 (runs of `gh workflow run ci`). PROVEN on a stock
   macos-15 runner: Maestro install, simulator boot, Expo SDK 54 install (lockfile committed),
   typecheck+jest layers green, claude -p headless under CLAUDE_CODE_OAUTH_TOKEN (smoke-gated),
   greenloop CLIs on PATH, verifier step timeouts (no more hangs). SOLE REMAINING BLOCKER:
   `expo run:ios` fails compiling expo-router's ExpoHead pod — `'yoga/style/Style.h' file not
   found` (same under newest Xcode and pinned 16.x; known SDK 54 pod header issue). Next moves:
   reproduce locally (`cd demo/miniclinic/apps/mobile && npx expo run:ios` — much faster
   iteration than CI), then either patch header search paths via config plugin, bump/pin
   expo-router to a fixed release, or drop the ExpoHead target. Evidence artifacts
   (`dogfood-evidence`) are uploaded on every run.

## Conventions

- Plain Node >= 20 ESM, zero runtime deps, `node --test` (no jest). No build step.
- Pure logic in `src/` with injectable `exec`/`log`; `bin/` are thin wrappers. TDD per plan docs.
- Work on a `plan-N-*` branch, merge to main when green.
- `bossPrompt()` in `src/core/loop.js` is exported for Plan 2's overnight skill to reuse.
