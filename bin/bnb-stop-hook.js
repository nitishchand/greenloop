#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadProgress } from '../src/core/progress.js';
import { decide } from '../src/hooks/stop-decision.js';

let input = {};
try {
  input = JSON.parse(readFileSync(0, 'utf8'));
} catch { /* no/invalid stdin -> treat as empty */ }

const cwd = input.cwd ?? process.cwd();
const progressPath = join(cwd, 'progress.json');
if (!existsSync(progressPath)) process.exit(0);

let decision;
try {
  decision = decide(loadProgress(progressPath));
} catch {
  process.exit(0); // unreadable progress.json must never wedge the session
}

if (decision.block) {
  console.error(decision.reason);
  process.exit(2);
}
process.exit(0);
