# Breathe-and-Build (BnB) — Design Spec

**Date:** 2026-07-08
**Status:** Approved design, pre-implementation
**Author:** Nitish Chand (with Claude Code)
**Reference:** [open-gsd/gsd-core](https://github.com/open-gsd/gsd-core); ClinicBuddy methodology (this repo)

---

## 1. Vision & positioning

BnB is a **spec-to-verified-app system**: an npx installer + Claude Code plugin that takes a
person from an idea to a working, E2E-verified app through human-gated planning phases and a
machine-gated build loop.

One-line differentiator vs gsd-core: *gsd tells the agent what to build; BnB forces it to prove
it built it.* Every feature must survive a committed, tamper-evident verifier (typecheck + unit +
real E2E on a simulator) before the agent is allowed to stop.

- **Breathe** = the deliberate, human-in-the-loop iteration phases (idea → PRD gap-hunting →
  architecture review).
- **Build** = the autonomous loop-engineered green loop (Plan → Implement → Author E2E →
  Verify → Self-correct → Checkpoint), enforced by a Stop hook.

This project codifies the exact methodology used to build ClinicBuddy, generalized for open
source.

## 2. Decisions log

| Decision | Choice |
|---|---|
| Name | **breathe-and-build** (npm package + repo); `bnb` as CLI alias and command prefix (`/bnb:*`). "BNB" alone collides with the Binance coin in search — always publish under the full name. |
| Form factor | Claude Code plugin **plus** `npx breathe-and-build@latest` guided installer |
| v1 build target | One stack profile done excellently: **expo-react-native** (the ClinicBuddy stack), macOS + iOS Simulator. Profile interface designed for more from day 1. |
| Skill dependencies | **Self-contained** — no superpowers prerequisite; BnB ships its own PRD/planning/debugging skills tuned to this workflow |
| Greenfield vs brownfield | **Greenfield only** in v1; `/bnb:onboard` for existing repos is v2 |
| Screen designs | PRD generator writes structured screen specs (ClinicBuddy prd.md style) by default; user may optionally attach Excalidraw/Figma references |
| Safety posture | Curated **allowlist by default** (no bypass needed for the loop); optional documented container recipe for full-bypass users |
| Workflow UX | **Phase commands + status router** (`/bnb` tells you where you are; explicit `/bnb:<phase>` commands) |
| Portability | Verify/loop drivers written in **Node, not bash** (Windows/Linux future); artifacts renamed `progress.txt` → `progress.json`; `spiritual-guide.md` keeps its name (fits the brand) |
| License | MIT |

## 3. Distribution & repo layout

Single GitHub repo `breathe-and-build`, publishing one npm package.

```
breathe-and-build/
  installer/                 # what `npx breathe-and-build@latest` runs
  plugin/                    # Claude Code plugin
    .claude-plugin/          #   plugin manifest
    commands/bnb/            #   phase commands (thin: route into skills)
    skills/                  #   self-contained skills (see §6)
    hooks/                   #   Stop hook (verify-before-stop)
  profiles/
    expo-react-native/       # v1 — fully shipped (see §7)
    flutter/                 # v2 — spec'd in roadmap only
  bin/                       # Node CLIs: bnb-verify, bnb-loop, bnb-doctor
  demo/miniclinic/           # canonical dogfood app (CI target, §11)
  docs/                      # tutorial, playbook, OS matrix, adapter guide
```

### Installer responsibilities (`npx breathe-and-build@latest`)

1. Preflight every dependency (Claude Code, Node, Docker, Xcode + iOS Simulator, Maestro).
   Auto-install only what is safe and scriptable (e.g. Maestro CLI); for the rest (Xcode,
   Docker Desktop) print exact copy-paste instructions and re-check in a loop. Never
   half-install.
2. Register the Claude Code plugin.
3. Configure MCP servers used by the loop: **Expo MCP, Metro MCP, Fetch MCP**.
4. Remind about macOS accessibility permission for the terminal/IDE (needed for automation).
5. Offer the optional container mode (§9) with its honest caveats.

## 4. Phase pipeline (commands)

Bare **`/bnb`** is the status router: reads `state.md` → "You are in <phase>. Next: <command>."

| Command | Phase | Human gate |
|---|---|---|
| `/bnb:idea` | Long free-form conversation about what the user wants to build. Ends by drafting `prd.md` v0. | User confirms the draft direction |
| `/bnb:prd` | The gap-hunting iteration loop (see below) | Exits only when a full pass finds **zero gaps** AND the user declares the PRD final |
| `/bnb:architecture` | Backend design review: DB schema, API surface, offline/sync strategy presented for the user to challenge and change. Tech-stack confirmation happens here (default = expo-react-native profile; overriding warns about losing the tuned verifier). | User approves architecture + stack |
| `/bnb:scaffold` | Births the project from the bound profile (§7): monorepo, Dockerized DB+BE, seeds, verifier, hooks, allowlist, all artifacts (§5) | User reviews scaffold + `spiritual-guide.md` they must fill in |
| `/bnb:feature <id>` | The green loop (§8) | Machine gate: `bnb-verify` exit 0; then code review + commit |
| `/bnb:overnight <tasks>` | Unattended boss-prompt mode (§8, headless variant) | Wake-up ritual: diff review + verify re-run before anything is trusted |
| `/bnb:doctor` | Environment health (profile-declared checks): simulator booted, Docker up, Metro reachable, LAN IP vs `.env.local`, MCPs connected, Maestro installed, accessibility permission | — |
| `/bnb:on-device` | (v1.x) Real-device testing over WiFi, IP baked into build — port of ClinicBuddy's testing-on-device skill | — |

### The PRD gap-hunting loop (`/bnb:prd`)

Codifies the 5–6 manual iterations used for ClinicBuddy:

1. Claude reads the **entire** current prd.md.
2. Actively hunts for gaps in the stitched user journey (dead ends, unspecified states,
   role/permission holes, data lifecycle gaps) and asks the user about them **one at a time**.
3. User answers in-chat or edits flows/DB schemas by hand; Claude folds answers back in.
4. Each pass ends with "gaps found: N". Repeat until N = 0 and the user says "final".

The generator writes **screen specs in the ClinicBuddy prd.md style** for every screen —
`S-01 / R-01`-coded blocks with **Purpose / Elements / Behaviour / Design notes**, plus the
**required `testIDs[]`** (naming per profile convention) so specs are E2E-ready by construction.
Users may optionally attach Excalidraw/Figma links or files, referenced from the spec blocks.

### Phase-gated prerequisites

Each command declares what it needs, and nothing more. `/bnb:idea`, `/bnb:prd`,
`/bnb:architecture` need only Claude Code — the entire planning phase runs on any machine with
zero mobile tooling. Xcode/Simulator/Docker are demanded only at `/bnb:scaffold` and
`/bnb:feature`. `/bnb:doctor` is the single diagnostic reused by the installer preflight and by
the verifier's exit-code-3 path, so a missing tool is caught at a phase boundary with a fix-it
list, never as a mid-loop surprise.

## 5. Artifact schema (shared memory)

All templated by the profile, all committed:

| Artifact | Role |
|---|---|
| `prd.md` | Source of truth for requirements; structured screen specs with testIDs |
| `state.md` | Living project state: stack, done-by-area, conventions, gotchas. Updated at every checkpoint; read at session start. |
| `debug.md` | Numbered bug ledger (symptom → root cause → fix → lesson). Future sessions read it first and cite entries ("see Bug 8"). |
| `progress.json` | Task ledger. Per task: `spec`, `acceptance[]`, `testIDs[]`, `flow`, `active` (arms the Stop hook), `passes` (**written only by bnb-verify**), `reflexions[]`, `abandoned`. The structured resume artifact for fresh sessions. |
| `spiritual-guide.md` | The user's business essence + priorities (filled at scaffold time). The answer-of-last-resort oracle for unattended runs, so the loop never blocks on the user. |
| `remaining-tasks.md` | Cross-session skip ledger for deferred critical work |
| `CLAUDE.md` | Generated per project: read state.md/debug.md first, LAN-IP session check, profile toolbelt usage, "commit after verified" |

## 6. Skills (self-contained)

Shipped in the plugin; no external plugin dependency:

- `bnb-prd` — the gap-hunting loop (§4)
- `bnb-architecture` — schema/API review facilitation
- `bnb-feature` — the green loop (§8)
- `bnb-debugging` — systematic debugging tuned to the loop: subagent-delegated investigation,
  evidence-before-hypothesis, debug.md citation and appending
- `bnb-overnight` — headless mode rules + spiritual-guide fallback protocol

Commands are thin wrappers that set phase context and invoke the matching skill.

## 7. Stack profiles (the key abstraction)

Swapping stacks swaps more than the E2E command, so the unit of extension is a **profile**, not
a verifier adapter:

```
profiles/<name>/
  templates/     # project scaffold: monorepo, docker-compose, CLAUDE.md, artifact templates
  verifier.json  # layer commands + e2e adapter (consumed by bnb-verify)
  toolbelt.md    # how the loop launches the app, reads logs, screenshots, dumps view tree
  conventions.md # testID naming, where E2E flows live, styling idioms
  doctor.json    # required tools + env checks for this profile
```

### v1: `expo-react-native` (macOS, iOS Simulator)

- Templates: Expo SDK + expo-router + WatermelonDB + Zustand + TanStack Query / Express +
  Prisma + PostgreSQL + Redis / docker-compose (postgres + redis + backend,
  `restart: unless-stopped`) / npm-workspaces monorepo with `packages/shared`.
- Verifier layers: `tsc --noEmit` (mobile + backend) → Jest (mobile + backend) → Maestro
  (`maestro-ios` adapter).
- Toolbelt: Expo MCP (screenshot, find_view, collect_app_logs), Metro, `maestro hierarchy`.
- Conventions: `testID` props; flows in `apps/mobile/.maestro/<feature>.yaml`;
  `launchApp: clearState: true`; `extendedWaitUntil` for network-gated UI.

### Roadmap: `flutter` (spec'd, not shipped in v1)

Maestro drives Flutter out of the box via the accessibility/semantics tree, so the E2E tool is
unchanged. What the profile swaps: testIDs become `Semantics(identifier:)` widgets; typecheck =
`dart analyze`; unit = `flutter test`; toolbelt = `flutter run` stdout / `flutter logs` +
`xcrun simctl io screenshot` (no Expo MCP equivalent). Alternative E2E tool **Patrol**
(Flutter-native, can drive native permission dialogs) is documented as an option; default stays
Maestro to keep one E2E tool across mobile profiles. *(Verify Maestro↔Flutter specifics against
current Maestro docs at implementation time.)*

### Unsupported stacks

If the user picks a stack with no profile at `/bnb:architecture`, BnB says so honestly and
offers: (a) stay on a supported profile, or (b) proceed off the paved road — BnB generates a
best-effort custom `verifier.json` and the user owns its quality. No silent degradation.

## 8. The feature loop & verifier contract

### `bnb-feature` (interactive, primary)

ClinicBuddy's develop-feature skill made profile-agnostic:

1. **Plan** — spec + `acceptance[]` + `testIDs[]` + flow path into `progress.json`;
   `active: true` arms the Stop hook.
2. **Implement** — follow profile conventions; add every declared testID; **see it render**
   (screenshot via toolbelt; blank/black = crash, not done).
3. **Author E2E first** — inspect the live view tree, confirm testIDs present, write the flow
   covering `acceptance[]`, **commit the flow before chasing green** (weakening later shows in
   the diff).
4. **Verify** — run `bnb-verify <task-id>`; read exit code + failing tail.
5. **Self-correct** — investigation is **delegated to a subagent** (gets spec/acceptance/
   testIDs, the failing tail, prior `reflexions[]`; returns hypothesis + evidence excerpt +
   suggested fix, ≤250 words; does not edit files). Main loop appends a Reflexion entry and
   applies the fix itself. Back to 4.
6. **Checkpoint** — code review (doubles as tamper check on the diff), commit,
   `active: false`, update `state.md`/`debug.md` if something non-obvious was learned.

### Verifier contract (`bnb-verify`, Node CLI)

Every profile's verifier honors:

- **Fail-fast layers**: typecheck → unit (ALL workspaces, both directions) → E2E.
- **Exit codes**: `0` green (sole writer of `passes: true`) · `1` real failure · `3` env not
  ready (doctor's checks failed — not a code failure) · `9` unknown task.
- **Log discipline**: full logs to a results dir; **only the failing tail printed** to the
  agent's context.
- Committed and tamper-evident: modifying the verifier or flows to force a pass is defined as
  reward hacking in the skills, and shows in the checkpoint diff review.

### `bnb-loop` (headless, `/bnb:overnight`)

Node port of ralph.sh: `claude -p` laps until green or max-laps, wrapped in a timeout, with the
restricted allowlist. The boss prompt instructs: never wait on the user — consult
`spiritual-guide.md` to resolve open questions. Wake-up ritual (in the skill): review the full
diff + re-run `bnb-verify` before trusting anything.

## 9. Hooks & safety

- **Stop hook** (`verify-before-stop`, Node): blocks stopping while the active task is red.
  Legitimate escape hatch: set `abandoned: true` (a recorded decision, not a workaround).
- **Permissions**: scaffold writes a curated project `settings.json` allowlist (bnb-verify,
  npm test/typecheck, maestro, simctl, profile MCP tools; deny `rm`, `git push`) so the loop
  runs hands-off **without** `--dangerously-skip-permissions`.
- **Optional container mode** (documented recipe, not the default): Claude in Docker with
  bypass on. Honest caveat: the iOS Simulator cannot run inside a Linux container — this mode
  covers backend/web work (and Android, once that profile exists).
- **Anti-reward-hacking**, enforced structurally not just by prompt: verifier + flows committed
  before green-chasing; `passes` machine-written only; diff review at checkpoint; red-flags
  table in the skill ("unit passes so it's done", "I'll tweak the flow", "context is long, let
  me wrap up" → reset + resume from progress.json instead).

## 10. Token economy (first-class goal)

- Failing-tail-only log discipline in every verifier.
- Debug investigation always via subagents returning capped summaries; log-watcher subagent
  pattern for BE/Metro streams (return anomalies only).
- `progress.json` as the structured resume artifact: skills instruct "context long → fresh
  session, resume" instead of degrading in place.
- **Playbook doc** (docs, not code): ccusage, statusline setup, model strategy (cheaper model
  for routine implementation, strongest model for hard debugging), cache-friendly loop cadence.

## 11. OS support matrix

| OS | v1 | Post-v1 |
|---|---|---|
| macOS | ✅ Full (`expo-react-native` + iOS Simulator — the only OS where an iOS sim exists) | Android emulator too |
| Linux | Planning phases only | ✅ Full once `maestro-android` profile lands (**first post-v1 milestone**) |
| Windows | Planning phases only | Via WSL2 with `maestro-android`; native later |

Portability decisions supporting this: all drivers (bnb-verify, bnb-loop, doctor, Stop hook)
in Node; the E2E target device (iOS sim / Android emulator / physical device) is a declared
profile field checked by doctor.

## 12. Testing & dogfooding

- **Canonical demo app** `demo/miniclinic` (2 screens + 1 API endpoint): CI runs the installer,
  scaffolds it from the profile, runs one `/bnb:feature` headlessly (bnb-loop), and asserts
  the verifier goes green. The tutorial is generated from the same run so docs can't drift.
- Unit tests for bnb-verify exit-code semantics and the Stop hook.
- The skills themselves follow writing-skills discipline (red-flag tables, hard rules up top).

## 13. Roadmap

- **v1**: everything above with the `expo-react-native` profile, macOS.
- **v1.x**: `/bnb:on-device`; `maestro-android` profile (unlocks Linux/Windows-WSL2).
- **v2**: `flutter` profile; `playwright-web` + `api-integration` verifier adapters (non-mobile
  apps); brownfield `/bnb:onboard`; community profile contribution guide.

## 14. Out of scope for v1

Multi-runtime support (OpenCode/Cursor etc.), brownfield onboarding, non-macOS build phases,
Excalidraw generation (user-attached references only), parallel UI agents (single dev-server
connection constraint), native Windows.

## 15. Open questions (deferred to implementation planning)

1. Exact plugin manifest/marketplace packaging details for Claude Code plugins at build time.
2. Whether Metro MCP and Fetch MCP remain separate servers or fold into the Expo MCP config.
3. `spiritual-guide.md` template contents — which prompts elicit a useful business essence from
   a first-time user.
