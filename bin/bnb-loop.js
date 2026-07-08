#!/usr/bin/env node
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadConfig } from '../src/core/config.js';
import { runVerify } from '../src/core/verifier.js';
import { runLoop, bossPrompt } from '../src/core/loop.js';

const cwd = process.cwd();
const taskId = process.argv[2];
const maxLaps = Number(process.argv[3] ?? 20);
if (!taskId) {
  console.error('usage: bnb-loop <task-id> [max-laps]   (wrap in `timeout 30m ...` for unattended runs)');
  process.exit(9);
}

let config;
try {
  config = loadConfig(cwd);
} catch {
  console.error('bnb-loop: no bnb.config.json in this directory');
  process.exit(9);
}
const loopCfg = config.loop ?? {};

process.exit(runLoop(taskId, {
  maxLaps,
  lap: (id) => {
    const args = ['-p', bossPrompt(id), '--permission-mode', 'acceptEdits', '--max-turns', String(loopCfg.maxTurns ?? 40)];
    if (loopCfg.allowedTools) args.push('--allowedTools', loopCfg.allowedTools);
    const r = spawnSync('claude', args, { cwd, stdio: 'inherit' });
    if (r.status !== 0) throw new Error(`claude exited ${r.status}`);
  },
  verify: (id) => runVerify(id, { cwd, config, progressPath: join(cwd, 'progress.json') }),
}));
