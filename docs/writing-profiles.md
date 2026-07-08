# Writing a stack profile

A profile is data, not code: five files under `profiles/<name>/` that the engines and
skills consume. If your stack can express these five files honestly, GreenLoop can drive it.

## Anatomy

| File | Contract |
|---|---|
| `verifier.json` | Layer commands for `greenloop-verify`: `typecheck[]` → `unit[]` (fail-fast, each `{name, run}`), `preflight[]` (`{name, run, fixHint}` — failures are exit 3, not code failures), `e2e` (`{adapter, run}` where `run` contains the literal `{flow}`, replaced by the task's flow path) |
| `doctor.json` | Array of `{name, run, fixHint}` environment checks for `greenloop-doctor`; all run, no fail-fast — the user gets the full fix-it list |
| `toolbelt.md` | How the loop launches the app, **sees the screen** (screenshot = the render proof), dumps the view tree, and reads logs without flooding context |
| `conventions.md` | testID (or equivalent) naming, where E2E flows live, wait discipline, code idioms to copy |
| `templates/` | The scaffold tree; `{{PROJECT_NAME}}`-style markers substituted by the scaffold engine, which never overwrites existing files |

## Resolution

A project binds a profile in `greenloop.config.json` (`"profile": "<name>"`). `loadConfig` merges
the profile's `verifier`/`doctor` under the project's config with one rule: **a key present
in the project config replaces the profile's key wholesale** — no deep merging, no
surprises. An unknown profile name is a hard error.

## The honesty rule

If a user picks a stack with no profile, say so and offer: a supported profile, or an
off-the-paved-road custom `verifier.json` whose quality they own. Never silently degrade —
a verifier that can't actually catch failures is worse than none, because it manufactures
false green.

## Checklist before shipping a profile

1. Exit codes honored: 0 green / 1 red / 3 env / 9 usage, driven by your commands' exits.
2. Every preflight and doctor check has a copy-paste `fixHint`.
3. `e2e.run` works against a flow authored per your `conventions.md`.
4. The template scaffold + one feature loop has gone green end-to-end on a clean machine
   (this is what pins your template dependency versions).
