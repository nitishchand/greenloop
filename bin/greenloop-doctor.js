#!/usr/bin/env node
import { loadConfig } from '../src/core/config.js';
import { runDoctor } from '../src/core/doctor.js';

let config;
try {
  config = loadConfig(process.cwd());
} catch (err) {
  console.error(`greenloop-doctor: ${err.code === 'ENOENT' ? 'no greenloop.config.json in this directory' : err.message}`);
  process.exit(9);
}
process.exit(runDoctor(config.doctor ?? []));
