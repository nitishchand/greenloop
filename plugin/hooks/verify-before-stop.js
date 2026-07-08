#!/usr/bin/env node
// Self-contained copy of bin/bnb-stop-hook.js: ${CLAUDE_PLUGIN_ROOT} only reaches the
// installed plugin/ tree, so this script cannot import from the package's src/.
// Behavioral parity is enforced by test/plugin-hook.test.js.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

let input = {};
try {
  input = JSON.parse(readFileSync(0, 'utf8'));
} catch { /* no/invalid stdin -> treat as empty */ }

const cwd = input.cwd ?? process.cwd();
const progressPath = join(cwd, 'progress.json');
if (!existsSync(progressPath)) process.exit(0);

let red;
try {
  const progress = JSON.parse(readFileSync(progressPath, 'utf8'));
  red = (progress.tasks ?? []).filter((t) => t.active && !t.passes && !t.abandoned);
} catch {
  process.exit(0); // unreadable progress.json must never wedge the session
}

if (red.length > 0) {
  const ids = red.map((t) => t.id).join(', ');
  console.error(
    `Active task(s) not green: ${ids}. Keep going: fix the FEATURE and run ` +
    `bnb-verify <task-id> until it exits 0. Do NOT weaken the verifier or the E2E flows. ` +
    `To stop legitimately, set "abandoned": true on the task in progress.json (a recorded decision).`,
  );
  process.exit(2);
}
process.exit(0);
