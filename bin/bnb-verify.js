#!/usr/bin/env node
import { join } from 'node:path';
import { loadConfig } from '../src/core/config.js';
import { runVerify, EXIT } from '../src/core/verifier.js';

const cwd = process.cwd();
const taskId = process.argv[2];

let config;
try {
  config = loadConfig(cwd);
} catch (err) {
  console.error(`bnb-verify: ${err.code === 'ENOENT' ? 'no bnb.config.json in this directory' : err.message}`);
  process.exit(EXIT.USAGE);
}

process.exit(runVerify(taskId, { cwd, config, progressPath: join(cwd, 'progress.json') }));
