> **Historical document:** written under the project's original name (breathe-and-build / bnb), renamed to **GreenLoop / greenloop** on 2026-07-09. Names below are as they were at implementation time; the code has been renamed.
# BnB Installer + MiniClinic + CI + Playbook Implementation Plan (Plan 4 of 4)

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking. Implement task-by-task, TDD where there is testable structure; commit per task.

**Goal:** Finish v1: the `npx breathe-and-build` guided installer (spec §3), the `demo/miniclinic` canonical dogfood app (§12), the CI workflow (unit always; dogfood best-effort), and the docs set (tutorial, playbook §10, OS matrix §11, profile-authoring guide, container-mode recipe §9) — plus a reusable scaffold engine that both the installer story and `/bnb:scaffold` rely on.

**Architecture:** Same shape as Plans 1–3: pure logic in `src/` with injectable `exec`/`log`/`ask`, thin CLI wrapper in `installer/index.js` (new `bin` entry `breathe-and-build`, so `npx breathe-and-build` runs it). The demo is **generated, then committed**: `demo/scaffold-miniclinic.js` regenerates `demo/miniclinic/` from the profile templates via the scaffold engine, and the feature files (screens, endpoint, flow, prd) live on top — a test asserts the committed demo matches what the engine would produce (no drift).

**Tech Stack:** Node >= 20, `node:test`, zero deps. GitHub Actions YAML. Markdown docs.

## Resolved design decisions (spec §15 Q2)

Verified against docs.expo.dev/mcp (2026-07-08): the Expo MCP is a **remote HTTP server** — `claude mcp add --transport http expo https://mcp.expo.dev/mcp` (OAuth via `/mcp`) — whose local capabilities (`automation_take_screenshot`, `automation_tap`, `automation_find_view`, `collect_app_logs`) require `expo-mcp` as a dev dependency (SDK 54+) and a dev server started with `EXPO_UNSTABLE_MCP_SERVER=1`. Therefore:

- **Metro MCP: folded into Expo MCP** (the dev server *is* Metro; logs/screens flow through Expo MCP local capabilities).
- **Fetch MCP: dropped** — Claude Code ships built-in WebFetch; a third server adds setup surface for nothing.
- Profile updates: mobile template gains `expo-mcp` dev dep and a `start` script exporting the flag; toolbelt documents the reconnect-after-restart gotcha.

## Global Constraints

- Plan 1–3 contracts frozen (exit codes, `loadConfig` signature/merge rule, profile file shapes).
- Installer never half-installs (§3): auto-install only Maestro (scriptable, user-confirmed); everything else = exact copy-paste instructions + re-check loop.
- Installer must work non-interactively: `--check` (report + exit 0/3, no changes) for CI and scripts; `--yes` auto-confirms the safe installs.
- CI honesty: the always-green gate is `npm test` on ubuntu + macos. The full §12 dogfood (installer → scaffold → headless feature → assert green) needs a simulator, Docker, Maestro, and `ANTHROPIC_API_KEY` — shipped as a `workflow_dispatch`-only job with its requirements documented inline, not pretended to be a PR gate.
- Docs are contracts too: structural tests pin key content markers.

---

### Task 1: scaffold engine

**Files:**
- Create: `src/core/scaffold.js`, `test/scaffold.test.js`

**Interfaces:**
- `scaffoldProject(templatesDir, targetDir, vars, { log = console.error } = {}) -> string[]` — recursive copy of the template tree; every file's content and every path segment get `{{KEY}}` → `vars.KEY` substitution; creates directories as needed; **throws if any destination file already exists** (never overwrite — the caller decides about existing projects); returns the relative paths written, sorted.
- Consumed by: `demo/scaffold-miniclinic.js` (Task 3) and the `/bnb:scaffold` command flow.

Tests: copies nested tree with substitution in content and filenames; throws on existing destination file (and writes nothing before throwing — check by running against a target seeded with one conflicting file); returns sorted relative paths; leaves unknown `{{MARKERS}}` intact (only substitute provided vars).

- [ ] Steps: tests (red) → implement → green → commit `feat(core): scaffold engine — template tree copy with {{VAR}} substitution, never overwrites`.

---

### Task 2: installer

**Files:**
- Create: `src/installer/checks.js`, `src/installer/run.js`, `installer/index.js`, `test/installer.test.js`
- Modify: `package.json` (add `"breathe-and-build": "installer/index.js"` to `bin`, add `"installer"` to `files`; update smoke test's expected bin keys), `profiles/expo-react-native/templates/apps/mobile/package.json` (add `expo-mcp` dev dep; `start` script becomes `EXPO_UNSTABLE_MCP_SERVER=1 expo start`), `profiles/expo-react-native/toolbelt.md` (exact MCP registration + reconnect gotcha)

**`checks.js`** — installer preflight (machine-level, no project needed): `claude` CLI, Node >= 20, Docker daemon, Xcode `simctl`, Maestro. Each `{ name, run, fixHint, autoInstall? }`; only Maestro has `autoInstall: 'curl -fsSL "https://get.maestro.mobile.dev" | bash'`.

**`run.js`** — `runInstaller({ exec, log, ask, checkOnly = false, autoYes = false, packageRoot }) -> 0 | 3`:

1. **Preflight loop**: run all checks (doctor-style, no fail-fast). All pass → continue. `checkOnly` → print ✓/✗ + fixHints, return 0/3 immediately. Failures with `autoInstall`: ask (or `autoYes`) → run it → re-check. Others: print exact fixHint instructions, then `ask('Press enter to re-check (or q to quit)')` and loop; quit → return 3 with "nothing was half-installed" note.
2. **Register plugin**: `claude plugin marketplace add <packageRoot>` then `claude plugin install bnb@breathe-and-build` (the plugin ships inside the npm package; `packageRoot` defaults to the package root resolved from `import.meta.url`).
3. **Register MCP**: `claude mcp add --transport http expo https://mcp.expo.dev/mcp`; print the `/mcp` OAuth reminder and the `expo-mcp` local-capabilities note.
4. **Reminders**: macOS accessibility permission; optional container mode → point at `docs/container-mode.md` with the iOS-simulator caveat.

**`installer/index.js`** — thin: parse `--check`/`--yes`, wire real `exec` (`runShell`), `ask` via `node:readline/promises`, exit with the returned code.

Tests (fakes): all-green run issues the plugin + MCP commands in order and returns 0; `checkOnly` with a failing check returns 3 and issues no registration commands; maestro missing + `autoYes` runs the autoInstall command then re-checks; declined re-check loop returns 3 and issues no registration commands. Integration: spawn `installer/index.js --check` with a stub `PATH` dir containing fake `claude`/`docker`/`xcrun`/`maestro` executables → exit 0.

- [ ] Steps: tests (red) → implement → green → commit `feat(installer): guided npx installer — preflight loop, plugin + Expo MCP registration, --check/--yes`.

---

### Task 3: MiniClinic demo

**Files:**
- Create: `demo/scaffold-miniclinic.js`, `demo/miniclinic/**` (generated + feature files), `test/demo.test.js`

**`scaffold-miniclinic.js`**: `node demo/scaffold-miniclinic.js` — wipes nothing; scaffolds `demo/miniclinic` from the profile templates with `PROJECT_NAME=miniclinic`, `DATE`, `BUNDLE_ID=com.example.miniclinic` — refuses if the directory exists (delete it first to regenerate; regeneration instructions in a header comment).

**Feature files on top of the scaffold** (the "2 screens + 1 endpoint" of §12):
- `prd.md` — final PRD: S-01 Patient list (empty state, list rows, add button), S-02 Add patient (name input, save, back-nav), permissions trivial (single role), Gaps log showing `gaps found: 0` + final. Written in the template's S-NN format with full testIDs.
- Mobile: `app/index.tsx` replaced by patient list (testIDs `patient-list-screen`, `patient-add-button`, `patient-row`, `patient-empty`), `app/add.tsx` (`add-patient-screen`, `patient-name-input`, `patient-save-button`); in-memory server state via TanStack Query against the backend.
- Backend: `src/patients.ts` + wiring in `src/index.ts` — `GET /patients`, `POST /patients` (in-memory store; Prisma model exists but v1 demo keeps the endpoint self-contained so the dogfood run needs only docker-or-local backend).
- `apps/mobile/.maestro/s01-patient-list.yaml` — clearState launch → wait `patient-list-screen` → assert `patient-empty` → tap add → input name → save → `extendedWaitUntil` row visible.
- `progress.json` — task `s01-patient-list` fully specced (`acceptance[]`, `testIDs[]`, `flow`), `active: false`, `passes: false` (armed by the dogfood run, not at rest).

Tests (`test/demo.test.js`): committed demo contains every file the scaffold engine would produce for `PROJECT_NAME=miniclinic` **with identical content for the untouched ones** (regenerate into a temp dir via the engine and diff, skipping the deliberately-replaced list) — the no-drift guarantee; progress task shape complete; flow file uses the declared testIDs; backend has both endpoints; prd Status is final.

- [ ] Steps: tests (red) → script + generate + feature files → green → commit `feat(demo): miniclinic — scaffolded dogfood app, 2 screens + patients endpoint, specced task + flow`.

---

### Task 4: CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`, `test/ci.test.js` (structural)

**`unit` job** (the real gate): push + PR; matrix `ubuntu-latest`/`macos-latest` × Node `20`/`22`; `npm test`.
**`dogfood` job**: `workflow_dispatch` only; `macos-15`; requirements documented in comments (ANTHROPIC_API_KEY secret, Maestro install step, `xcrun simctl boot`, backend via `npm run dev -w apps/backend` since Docker isn't on macOS runners); steps: install → scaffold check (`node demo/scaffold-miniclinic.js` into temp + diff) → `installer/index.js --check` (informational `continue-on-error`) → the headless feature lap `timeout 30m bnb-loop s01-patient-list` gated by a fresh `bnb-verify` — the §12 assertion. Job carries an honest header comment: this is the aspirational full loop; it becomes a scheduled gate once the repo has a runner with the mobile toolchain proven.

Tests: workflow parses as YAML? (zero deps — regex-assert): has `unit:` and `dogfood:` jobs, unit triggers on push/PR, dogfood is dispatch-only, unit runs `npm test` on both OSes.

- [ ] Steps: tests (red) → write workflow → green → commit `ci: unit gate (ubuntu+macos × node 20/22) + dispatch-only dogfood job`.

---

### Task 5: docs set + README

**Files:**
- Create: `docs/tutorial.md`, `docs/playbook.md`, `docs/os-matrix.md`, `docs/writing-profiles.md`, `docs/container-mode.md`
- Modify: `README.md` (Docs section linking all five; installer usage section)

Contracts:
- **tutorial.md** — the MiniClinic walkthrough end to end: install (`npx breathe-and-build`), `/bnb` → idea → prd (show one real gap-hunt exchange) → architecture → scaffold → `/bnb:feature s01-patient-list` with the expected `bnb-verify` output at each gate; ends with the overnight variant. Notes it mirrors `demo/miniclinic` so readers can diff their result.
- **playbook.md** (§10) — token economy in practice: failing-tail discipline (what 40 lines buys), subagent-capped investigation, progress.json resume ritual ("context long → fresh session"), ccusage + statusline setup pointers, model strategy (routine implementation on the cheaper model, hard debugging on the strongest), cache-friendly loop cadence (keep laps under the cache TTL; batch config reads).
- **os-matrix.md** (§11) — the v1/post-v1 support table + why (iOS sim exists only on macOS), the `maestro-android` first-post-v1-milestone note, WSL2 path.
- **writing-profiles.md** — profile anatomy (5 files + templates), the `loadConfig` merge rule, the verifier/doctor JSON contracts (exit codes, `{flow}`), conventions/toolbelt authoring guidance, "unsupported stack" honesty rule.
- **container-mode.md** (§9) — the documented recipe: Claude Code in Docker with bypass, curated mounts; the honest caveat up top (iOS Simulator cannot run in a Linux container — this covers backend/web work only, Android once that profile exists).

Tests: each file exists with 2–3 key markers (tutorial: `miniclinic` + `bnb-verify`; playbook: `ccusage` + failing tail; os-matrix: `maestro-android`; writing-profiles: `verifier.json` + wholesale; container-mode: the simulator caveat). README links all five and documents `npx breathe-and-build --check`.

- [ ] Steps: tests (red) → write docs → green → commit `docs: tutorial, playbook, OS matrix, profile authoring, container mode + README links`.

---

### Task 6: close out v1

- [ ] Full `npm test` green; `claude plugin validate ./plugin` + `claude plugin validate .` clean.
- [ ] `state.md`: Plan 4 ✅; v1 status summary; remaining human steps (create GitHub repo + push, `npm publish`, first real dogfood run to pin template versions) listed explicitly.
- [ ] Merge `plan-4-installer` → `main` (no-ff): `merge: plan 4/4 installer + miniclinic demo + ci + docs — v1 feature-complete`.

## Self-Review

- **Spec coverage:** §3 installer responsibilities 1–5 → Task 2 (preflight loop / plugin / MCP / accessibility / container pointer); §12 demo + CI → Tasks 3–4 (with the dogfood job's honesty caveat); §10 playbook → Task 5; §11 matrix → Task 5; §15 Q2 resolved in header. Tutorial-generated-from-CI-run (§12) is deferred until the dogfood job actually runs on a provisioned runner — tutorial mirrors the committed demo instead; recorded in state.md.
- **Contract safety:** new `bin` entry only adds; smoke test updated in the same commit. Scaffold engine never overwrites. Installer `--check` is side-effect-free.
- **Honest limits:** demo E2E/typecheck never executed in this repo (no Expo install here); the no-drift test pins structure, the dogfood job is the executor. Stated in state.md.

