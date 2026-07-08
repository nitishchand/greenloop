#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import readline from 'node:readline/promises';
import { runShell } from '../src/core/exec.js';
import { runInstaller } from '../src/installer/run.js';

const args = new Set(process.argv.slice(2));
if (args.has('--help') || args.has('-h')) {
  console.error('usage: npx breathe-and-build [--check] [--yes]');
  console.error('  --check  preflight report only (exit 0 ready / 3 not ready); changes nothing');
  console.error('  --yes    auto-confirm the safe auto-installs (Maestro)');
  process.exit(0);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
const code = await runInstaller({
  exec: runShell,
  ask: (q) => rl.question(q),
  checkOnly: args.has('--check'),
  autoYes: args.has('--yes'),
  packageRoot: fileURLToPath(new URL('..', import.meta.url)),
});
rl.close();
process.exit(code);
