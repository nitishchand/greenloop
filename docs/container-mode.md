# Container mode (optional)

**The caveat first: the iOS Simulator cannot run inside a Linux container.** Container mode
covers backend and web work only (and Android, once the `maestro-android` profile exists).
For the full expo-react-native loop, stay on the host with the curated allowlist — that is
the default and it needs no permission bypass.

## When it's worth it

You want `--dangerously-skip-permissions` levels of hands-off for **backend-only** overnight
runs, and you'd rather isolate the blast radius than curate an allowlist.

## Recipe

```bash
docker run -it --rm \
  -v "$PWD":/work -w /work \
  -v ~/.claude.json:/root/.claude.json \
  --network host \
  node:20 bash -lc '
    npm install -g @anthropic-ai/claude-code &&
    claude --dangerously-skip-permissions -p "..."
  '
```

- Mount only the project directory — the container's writable world is the repo.
- `--network host` lets the loop reach the dockerized DB/backend on localhost. For stricter
  isolation, run the DB inside the same container instead.
- The verifier's E2E layer must be a container-runnable adapter (API-level tests); the
  Maestro/simulator layer is unavailable here by definition — configure the project's
  `bnb.config.json` `verifier.e2e` accordingly and say so in `state.md`.

## What you give up

The tamper-evidence audience: with bypass on, nothing stops mid-run edits to the verifier —
you rely entirely on the checkpoint diff review (wake-up ritual). Do not skip it.
