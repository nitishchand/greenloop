import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const CLI = new URL('../bin/greenloop-verify.js', import.meta.url).pathname;

function project({ unitExit = 0 } = {}) {
  const cwd = mkdtempSync(join(tmpdir(), 'greenloop-cli-'));
  writeFileSync(join(cwd, 'greenloop.config.json'), JSON.stringify({
    verifier: {
      typecheck: [{ name: 'tc', run: 'node -e "process.exit(0)"' }],
      unit: [{ name: 'unit', run: `node -e "console.error('unit says no'); process.exit(${unitExit})"` }],
    },
  }));
  writeFileSync(join(cwd, 'progress.json'), JSON.stringify({
    tasks: [{ id: 't1', passes: false, active: true }],
  }));
  return cwd;
}

function run(cwd, ...args) {
  return spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: 'utf8' });
}

test('green project exits 0 and sets passes:true', () => {
  const cwd = project();
  const r = run(cwd, 't1');
  assert.equal(r.status, 0);
  assert.match(r.stderr, /✓ green/);
});

test('failing unit exits 1 and prints the failing tail', () => {
  const cwd = project({ unitExit: 1 });
  const r = run(cwd, 't1');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /unit says no/);
});

test('missing task id exits 9', () => {
  const cwd = project();
  assert.equal(run(cwd).status, 9);
});
