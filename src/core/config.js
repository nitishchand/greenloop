import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export function loadConfig(cwd) {
  return JSON.parse(readFileSync(join(cwd, 'bnb.config.json'), 'utf8'));
}
