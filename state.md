# GreenLoop — Project State

**Last updated:** 2026-07-11
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

## v1 status — RELEASED

**`greenloop@0.1.0` published to npm 2026-07-12** (74 files, shasum a4ef1df…, maintainer
nitishchand). Verified post-publish: `npx -y greenloop@0.1.0 --check` from a cold empty
directory pulls from the registry and passes all five preflights (exit 0). Install:
`npx greenloop` · plugin: `claude plugin install greenloop@greenloop`.

## Dogfood record (spec §12 — complete)

All four plans merged. **CI dogfood run 9 (id 29152550192) went fully green on a stock
macos-15 runner**: scaffold parity, backend + Metro, `expo run:ios` build + simulator
install, `greenloop-loop s01-patient-list 10` headless (green unattended in 27 min,
including one mid-loop red e2e lap the agent debugged via Maestro screenshot +
hierarchy dump), and the wake-up fresh `greenloop-verify` green in ~90 s with
`passes: true` written by the verifier. `docs/tutorial.md` §7 carries the receipts
(spec §12 satisfied). Evidence artifacts (`dogfood-evidence`) now include the verifier
logs (copied under a visible name — upload-artifact v4 drops hidden dirs) and
`~/.maestro/tests` debug output.

History of the two dogfood blockers (runs 1–8, all fixed):

- Runs 1–7 hardened everything up to the pod build (headless trust, CLIs on PATH,
  verifier step timeouts, lockfile, smoke gate) but `expo run:ios` failed compiling
  expo-router's ExpoHead pod: `'yoga/style/Style.h' file not found`.
- **Root cause (found 2026-07-11 by local repro):** never an Xcode problem —
  expo-router declares `react-native-screens`/`safe-area-context` as `"*"`, so npm
  floated screens to 4.25+/4.26, whose header layout breaks ExpoHead's yoga includes
  AND whose renamed `RNSBottomTabs*` → `RNSTabs*` classes break
  `LinkPreviewNativeNavigation.mm` (second error hidden behind the first).
  react/react-dom/react-native drifted the same way (19.2.7/0.81.6 vs the SDK 54 set),
  duplicating react across the workspace. Fix (templates + demo, no-drift kept): pin
  the exact SDK 54 native set in apps/mobile/package.json (react 19.1.0, react-dom
  19.1.0, react-native 0.81.5, react-native-screens ~4.16.0,
  react-native-safe-area-context ~5.6.0) and mirror it in workspace-root `overrides`.
  Verified locally on Xcode 26.6 before CI. CI Xcode 16 pin removed (wrong hypothesis).
  Prebuild's package.json script injections folded into the template; generated
  `apps/mobile/ios|android` gitignored.
- Run 8: everything green through the loop, but the wake-up verify flaked at
  tap-add → add-patient-screen (tap swallowed right after a fresh clearState launch).
  Fixed by wrapping tap+wait in a Maestro `retry` block in the s01 flow. Run 9 green.

## Conventions

- Plain Node >= 20 ESM, zero runtime deps, `node --test` (no jest). No build step.
- Pure logic in `src/` with injectable `exec`/`log`; `bin/` are thin wrappers. TDD per plan docs.
- Work on a `plan-N-*` branch, merge to main when green.
- `bossPrompt()` in `src/core/loop.js` is exported for Plan 2's overnight skill to reuse.
