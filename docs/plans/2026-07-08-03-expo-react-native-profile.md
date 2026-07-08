# BnB expo-react-native Profile Implementation Plan (Plan 3 of 4)

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking. Implement task-by-task, TDD where there is testable structure; commit per task.

**Goal:** Ship the v1 stack profile (spec §7): `profiles/expo-react-native/` with `verifier.json`, `doctor.json`, `toolbelt.md`, `conventions.md`, and the scaffold `templates/` tree (Expo + expo-router mobile app, Express + Prisma backend, docker-compose, npm-workspaces monorepo, curated allowlist) — plus the **profile resolution** that Plan 1 deferred: `loadConfig` merges a named profile's verifier/doctor/loop defaults under the project's `bnb.config.json` overrides.

**Architecture:** A profile is data, not code — JSON consumed by the Plan 1 engines and markdown consumed by the Plan 2 skills. The only code change is in `src/core/config.js`: resolve `config.profile` against the package's own `profiles/` directory and merge (project wins, wholesale per key). Templates are structurally tested (parse, required services/fields/markers) but not executed here — the MiniClinic demo + CI (Plan 4) is what runs them for real.

**Tech Stack:** JSON + markdown; Node for the config merge; `node:test`.

## Global Constraints

- Plan 1 CLI/exit-code contracts are frozen. `loadConfig(cwd)` keeps its signature; configs without a `profile` field (and configs whose keys fully override the profile) behave exactly as before — all existing tests must stay green untouched.
- Merge semantics (documented in README): for `verifier`, `doctor`, `loop` — a key present in the project config replaces the profile's key **wholesale** (no deep/array merging: predictability over cleverness). Unknown profile name → throw `Error("unknown profile '<name>'")` at load time (honesty rule §7: no silent degradation).
- Profiles live in the package at `profiles/<name>/`, resolved relative to `src/core/config.js` via `import.meta.url` (works installed and in-repo). `package.json` `files` already ships `profiles`.
- Templates use `{{PROJECT_NAME}}`/`{{DATE}}` placeholders (same convention as plugin templates). Dependency versions in templates are best-known-current and get pinned/verified when the MiniClinic demo first runs (Plan 4) — note this in comments where it matters.
- Spec §7 fidelity: verifier layers `tsc --noEmit` (mobile + backend) → Jest (mobile + backend) → Maestro `maestro-ios`; flows in `apps/mobile/.maestro/<feature>.yaml`; `clearState: true`; `extendedWaitUntil` for network-gated UI; docker-compose services postgres + redis + backend with `restart: unless-stopped`; allowlist per §9 (no `rm`, no `git push`).

---

### Task 1: verifier.json + doctor.json

**Files:**
- Create: `profiles/expo-react-native/verifier.json`, `profiles/expo-react-native/doctor.json`, `test/profile.test.js`

`verifier.json` — same shape `bnb-verify` consumes today:

- `typecheck`: `mobile-tsc` = `npm run typecheck -w apps/mobile`, `backend-tsc` = `npm run typecheck -w apps/backend`
- `unit`: `mobile-jest` = `npm test -w apps/mobile`, `backend-jest` = `npm test -w apps/backend`
- `preflight`: `backend-up` = `curl -sf http://localhost:3001/health` (fixHint `docker compose up -d`), `simulator-booted` = `xcrun simctl list devices | grep -q Booted` (fixHint boot via Simulator.app or `xcrun simctl boot`), `metro-up` = `curl -sf http://localhost:8081/status` (fixHint `npm start -w apps/mobile`)
- `e2e`: `{ "adapter": "maestro-ios", "run": "maestro test {flow}" }`

`doctor.json` — array for `runDoctor` (spec §4 doctor list, scriptable subset; each with fixHint):
node >= 20 · Docker daemon · Xcode CLT/simctl · a booted simulator · Maestro CLI · Metro reachable · plus an always-passing `accessibility-reminder` check (`true`) whose fixHint documents the macOS accessibility permission (not scriptable — surfaced as a reminder, §3.4).

Tests (`test/profile.test.js`): both files parse; verifier has the 4 layers with the exact step names above; every preflight/doctor entry has `name`/`run` (+ `fixHint` where stated); e2e run contains `{flow}`; adapter is `maestro-ios`.

- [ ] Steps: tests (red) → write JSON → green → commit `feat(profile): expo-react-native verifier + doctor config`.

---

### Task 2: profile resolution in loadConfig

**Files:**
- Modify: `src/core/config.js`
- Test: `test/config-profile.test.js`

Implementation:

```js
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PROFILES_DIR = fileURLToPath(new URL('../../profiles', import.meta.url));

export function loadConfig(cwd, { profilesDir = PROFILES_DIR } = {}) {
  const config = JSON.parse(readFileSync(join(cwd, 'bnb.config.json'), 'utf8'));
  if (!config.profile) return config;
  const dir = join(profilesDir, config.profile);
  if (!existsSync(dir)) throw new Error(`unknown profile '${config.profile}'`);
  const readJson = (f) => JSON.parse(readFileSync(join(dir, f), 'utf8'));
  return {
    ...config,
    verifier: { ...readJson('verifier.json'), ...(config.verifier ?? {}) },
    doctor: config.doctor ?? readJson('doctor.json'),
    loop: { ...(config.loop ?? {}) },
  };
}
```

(`loop` has no profile file in v1 — scaffold's `bnb.config.json` template carries the allowlist; keep the shape stable.)

Tests: project with `profile` and no `verifier` → gets the profile's layers; project `verifier.unit` override replaces the profile's `unit` wholesale while `typecheck`/`e2e` come from the profile; project `doctor` wins wholesale; no `profile` field → returned untouched; unknown profile → throws `/unknown profile 'ghost'/`; CLI-level: `bnb-verify` in a fixture project whose config is just `{ "profile": "expo-react-native", "verifier": { ...tiny node -e steps..., "e2e": null } }`… keep CLI test simple: profile resolution exercised through `loadConfig` unit tests plus one `bnb-doctor` spawn against a config with `profile` set and a project-level `doctor` override (proves the CLIs pick up merged config without touching the real toolchain).

- [ ] Steps: tests (red) → implement → full suite green (Plan 1 tests untouched) → commit `feat(core): profile resolution — loadConfig merges profile verifier/doctor under project overrides`.

---

### Task 3: toolbelt.md + conventions.md

**Files:**
- Create: `profiles/expo-react-native/toolbelt.md`, `profiles/expo-react-native/conventions.md`

**toolbelt.md** (how the loop drives the app — spec §7): launching (docker compose for DB/BE, `npm start -w apps/mobile` for Metro, install/launch on simulator); **seeing the screen**: Expo MCP `screenshot` (blank/black = crash), `find_view`, `collect_app_logs`; view-tree dump via `maestro hierarchy` (the testID ground truth before authoring flows); reading logs: Metro stdout via MCP, backend via `docker compose logs backend --tail`; log-watcher subagent pattern (§10): stream-watching is delegated, anomalies-only summaries; simulator control: `xcrun simctl` basics (boot, io screenshot as MCP fallback).

**conventions.md**: testID naming `<screen>-<element>` kebab-case, declared in the PRD S-NN block and attached as literal `testID` props (never computed — Maestro matches literals); flows at `apps/mobile/.maestro/<feature>.yaml`, one flow per task, `flow` path recorded in `progress.json`; every flow starts `launchApp: clearState: true`; network-gated UI waits use `extendedWaitUntil` (never `sleep`); styling idioms (expo-router file routes; screens in `app/`, shared UI in `packages/shared`; Zustand for client state, TanStack Query for server state, WatermelonDB for offline-first entities).

Tests (extend `test/profile.test.js`): toolbelt mentions `screenshot`, `maestro hierarchy`, `collect_app_logs`, subagent log-watcher; conventions mentions `testID`, `.maestro/`, `clearState`, `extendedWaitUntil`.

- [ ] Steps: tests (red) → write docs → green → commit `feat(profile): toolbelt + conventions docs`.

---

### Task 4: scaffold templates

**Files:**
- Create under `profiles/expo-react-native/templates/`:
  - root: `package.json` (npm workspaces `apps/*`, `packages/*`; scripts fan out `-ws`), `docker-compose.yml`, `.env.example`, `.gitignore`, `bnb.config.json`, `.claude/settings.json`
  - `apps/mobile/`: `package.json` (expo, expo-router, zustand, @tanstack/react-query, @nozbe/watermelondb; jest-expo; scripts `typecheck`/`test`/`start`), `tsconfig.json`, `app.json`, `app/_layout.tsx`, `app/index.tsx` (renders `testID="home-screen"`), `.maestro/smoke.yaml` (launch `clearState: true`, `extendedWaitUntil` visible `home-screen`)
  - `apps/backend/`: `package.json` (express, prisma/@prisma/client, redis; jest+ts-jest; scripts `typecheck`/`test`/`dev`), `tsconfig.json`, `src/index.ts` (Express app with `GET /health` → `{ ok: true }`, listens 3001), `prisma/schema.prisma` (postgres datasource from `DATABASE_URL`, minimal example model)
  - `packages/shared/`: `package.json`, `tsconfig.json`, `src/index.ts`

Key contents:

- **docker-compose.yml**: services `postgres` (volume, healthcheck), `redis`, `backend` (build `./apps/backend`, port 3001, depends_on healthy postgres) — all three `restart: unless-stopped` (§7).
- **bnb.config.json**: `{ "profile": "expo-react-native", "resultsDir": ".bnb/results", "tailLines": 40, "loop": { "allowedTools": "Read,Edit,Write,Grep,Glob,Bash(bnb-verify:*),Bash(bnb-doctor:*),Bash(npm test:*),Bash(npm run typecheck:*),Bash(maestro test:*),Bash(maestro hierarchy:*),Bash(xcrun simctl:*),Bash(docker compose logs:*)", "maxTurns": 40 } }` — verifier/doctor come from the profile via Task 2.
- **.claude/settings.json** (§9 curated allowlist): permissions allow the same command families + `docker compose up`, deny `Bash(rm:*)`, `Bash(git push:*)`, `Bash(sudo:*)`.
- **.env.example**: `DATABASE_URL`, `REDIS_URL`, `EXPO_PUBLIC_API_URL=http://<LAN-IP>:3001` with the LAN-IP note (state.md gotcha pattern).

Tests (extend `test/profile.test.js`): every listed file exists; all JSON files parse (including `.claude/settings.json`); root package.json declares both workspace globs; docker-compose (parse as YAML? no — zero deps: regex-assert) has `postgres:`, `redis:`, `backend:` and three `restart: unless-stopped`; settings.json denies `rm` and `git push`; smoke.yaml has `clearState: true` and `extendedWaitUntil`; mobile index.tsx contains `testID="home-screen"`; backend index.ts serves `/health`; bnb.config.json names the profile and omits `verifier` (proving the merge path is the real path).

- [ ] Steps: tests (red) → write templates → green → commit `feat(profile): scaffold templates — Expo+Express+Prisma monorepo, docker-compose, curated allowlist`.

---

### Task 5: README profile section + state.md + merge

- [ ] README: add a **Stack profiles** section — profile anatomy (5 files, from §7), the merge rule (project key replaces profile key wholesale; unknown profile throws), `expo-react-native` summary table, pointer to Plan 4 for the demo that exercises the templates.
- [ ] Test: README mentions `profiles/expo-react-native`.
- [ ] Full `npm test` green; `claude plugin validate ./plugin` still clean.
- [ ] Update `state.md` (Plan 3 ✅ + merge-semantics note under Conventions).
- [ ] Merge `plan-3-profile` → `main` (no-ff): `merge: plan 3/4 expo-react-native profile — verifier/doctor config, profile merge, toolbelt/conventions, scaffold templates`.

## Self-Review

- **Spec coverage:** §7 profile anatomy → Tasks 1, 3, 4; §7 v1 stack list → Task 4 deps; §4 doctor checks → Task 1 (scriptable subset + accessibility reminder); §9 allowlist → Task 4 settings.json; §10 log-watcher pattern → Task 3 toolbelt; Plan 1's deferred profile merging → Task 2. Flutter profile stays roadmap-only (§7); demo/CI that executes templates is Plan 4 by design.
- **Contract safety:** merge is additive — configs without `profile` bypass it entirely; README documents the wholesale-override rule; unknown profile throws per the no-silent-degradation rule.
- **Honest limits:** template dependency versions are unverified until Plan 4's MiniClinic run; recorded in Global Constraints and as comments in the templates.
