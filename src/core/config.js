import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PROFILES_DIR = fileURLToPath(new URL('../../profiles', import.meta.url));

// Merge rule: a key present in the project config replaces the profile's key wholesale
// (no deep/array merging). Unknown profile names throw — no silent degradation.
export function loadConfig(cwd, { profilesDir = PROFILES_DIR } = {}) {
  const config = JSON.parse(readFileSync(join(cwd, 'greenloop.config.json'), 'utf8'));
  if (!config.profile) return config;

  const dir = join(profilesDir, config.profile);
  if (!existsSync(dir)) throw new Error(`unknown profile '${config.profile}'`);
  const readJson = (file) => JSON.parse(readFileSync(join(dir, file), 'utf8'));

  return {
    ...config,
    verifier: { ...readJson('verifier.json'), ...(config.verifier ?? {}) },
    doctor: config.doctor ?? readJson('doctor.json'),
  };
}
