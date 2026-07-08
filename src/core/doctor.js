import { runShell } from './exec.js';

export function runDoctor(checks, { exec = runShell, log = console.error } = {}) {
  let failed = 0;
  for (const check of checks ?? []) {
    const { code } = exec(check.run, {});
    if (code === 0) {
      log(`✓ ${check.name}`);
    } else {
      failed += 1;
      log(`✗ ${check.name}${check.fixHint ? ` — fix: ${check.fixHint}` : ''}`);
    }
  }
  return failed === 0 ? 0 : 3;
}
