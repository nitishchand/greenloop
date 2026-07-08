# Breathe-and-Build (BnB)

A **spec-to-verified-app system** for Claude Code: an npx installer + plugin that takes you from
an idea to a working, E2E-verified app through human-gated planning phases ("breathe") and a
machine-gated build loop ("build"). Every feature must survive a committed, tamper-evident
verifier — typecheck + unit + real E2E on a simulator — before the agent is allowed to stop.

> **Status: early development.** The core engine (this package's CLIs) is implemented; the
> Claude Code plugin, the `expo-react-native` stack profile, and the guided installer are in
> progress. Design spec: [`docs/specs/2026-07-08-breathe-and-build-design.md`](docs/specs/2026-07-08-breathe-and-build-design.md).

## CLIs

All commands run in the *target project* directory (the app being built) and read
`bnb.config.json` + `progress.json` from its root.

| Command | Purpose |
|---|---|
| `bnb-verify <task-id>` | The green gate: typecheck → unit → env preflight → E2E, fail-fast. Sole writer of `passes` in `progress.json`. |
| `bnb-doctor` | Runs every environment check from config, prints the full ✓/✗ fix-it list. |
| `bnb-loop <task-id> [max-laps]` | Headless laps: runs `claude -p` with the boss prompt, gates each lap on `bnb-verify`. Wrap in `timeout 30m ...` for unattended runs. |
| `bnb-stop-hook` | Claude Code Stop hook: blocks the session from stopping while an active task is red (exit 2). Escape hatch: set `"abandoned": true` on the task. |

## Exit-code contract

| Code | Meaning |
|---|---|
| `0` | Green — all layers passed (`passes: true` written) |
| `1` | Red — a real failure (`passes: false` written); only the failing tail is printed, full logs in `.bnb/results/<task>/` |
| `3` | Environment not ready (preflight/doctor failure) — **not** a code failure; `passes` untouched |
| `9` | Usage error / unknown task |

## `bnb.config.json`

```json
{
  "profile": "expo-react-native",
  "resultsDir": ".bnb/results",
  "tailLines": 40,
  "verifier": {
    "typecheck": [{ "name": "mobile-tsc", "run": "npm run typecheck -w apps/mobile" }],
    "unit": [{ "name": "mobile-jest", "run": "npm test -w apps/mobile" }],
    "preflight": [{ "name": "backend-up", "run": "curl -sf http://localhost:3001/health", "fixHint": "docker compose up -d" }],
    "e2e": { "adapter": "maestro-ios", "run": "maestro test {flow}" }
  },
  "doctor": [
    { "name": "docker", "run": "docker info", "fixHint": "Start Docker Desktop" }
  ],
  "loop": {
    "allowedTools": "Read,Edit,Write,Bash(bnb-verify:*),Bash(npm test:*),Bash(npm run typecheck:*),Bash(maestro test:*),Bash(maestro hierarchy:*)",
    "maxTurns": 40
  }
}
```

`{flow}` in `e2e.run` is replaced by the task's `flow` path from `progress.json`.

## `progress.json`

```json
{
  "tasks": [
    {
      "id": "s01-login",
      "spec": "Login screen per PRD S-01",
      "acceptance": ["user can log in with phone+PIN"],
      "testIDs": ["login-screen", "phone-input"],
      "flow": ".maestro/s01-login.yaml",
      "active": true,
      "passes": false,
      "abandoned": false,
      "reflexions": []
    }
  ]
}
```

Rules the whole system depends on:

- **`bnb-verify` is the only writer of `passes`.** Agents and humans never hand-set it.
- `active: true` arms the Stop hook; an active, non-passing, non-abandoned task blocks the
  Claude Code session from stopping.
- Weakening the verifier config or an E2E flow to force a pass is reward hacking; both are
  committed, so tampering shows in the diff.

## Development

Node >= 20, ESM, zero runtime dependencies. Tests use the built-in runner:

```bash
npm test
```

## License

MIT
