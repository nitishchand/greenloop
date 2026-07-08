#!/usr/bin/env node
import { loadConfig } from '../src/core/config.js';
import { runDoctor } from '../src/core/doctor.js';

let config;
try {
  config = loadConfig(process.cwd());
} catch {
  console.error('bnb-doctor: no bnb.config.json in this directory');
  process.exit(9);
}
process.exit(runDoctor(config.doctor ?? []));
