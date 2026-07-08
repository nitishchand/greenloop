# expo-react-native — toolbelt

How the loop launches the app, sees the screen, and reads logs. The bnb-feature skill
assumes these tools; nothing here waits on a human.

## Launching

1. Services: `docker compose up -d` (postgres, redis, backend — healthchecked; verify with
   `curl -sf http://localhost:3001/health`).
2. Dev server: `npm start -w apps/mobile` (Metro on :8081 with `EXPO_UNSTABLE_MCP_SERVER=1`
   baked into the script so Expo MCP local capabilities attach; verify
   `curl -sf http://localhost:8081/status`). The Expo MCP server itself is registered
   machine-wide by the installer (`claude mcp add --transport http expo https://mcp.expo.dev/mcp`).
   Gotcha: restarting the dev server requires reconnecting MCP in the Claude Code session (`/mcp`).
3. App on the simulator: launched through the Expo MCP (or `i` in the Metro terminal). The
   simulator must already be booted — that's a doctor/preflight concern, not yours mid-loop.

## Seeing the screen (the "see it render" rule)

- **Screenshot**: Expo MCP `screenshot` tool. Fallback: `xcrun simctl io booted screenshot /tmp/shot.png`.
  A blank or black screenshot means the app crashed — treat it as red, read the logs; it is
  never "done".
- **Find an element**: Expo MCP `find_view` (by testID) confirms a testID is mounted.
- **View-tree ground truth**: `maestro hierarchy` dumps what Maestro can actually see.
  Run it BEFORE authoring a flow — every testID the flow references must appear here first.

## Reading logs

- **App/Metro logs**: Expo MCP `collect_app_logs` (runtime JS errors, render warnings).
- **Backend logs**: `docker compose logs backend --tail 50` (add `-f` only inside a watcher).
- **Log-watcher pattern (token economy):** never stream logs into the main context. Delegate
  watching Metro/backend streams to a subagent that returns **anomalies only** (errors,
  stack traces, repeated warnings) in a capped summary. The main loop reads conclusions,
  not streams.

## Simulator control

- Boot: `xcrun simctl boot "iPhone 16"` (doctor's fix hint; usually already booted).
- The E2E device target is the booted iOS simulator — `maestro test` picks it up directly.
