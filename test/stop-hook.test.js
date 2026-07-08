import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { decide } from '../src/hooks/stop-decision.js';

test('decide blocks when an active task is red', () => {
  const d = decide({ tasks: [{ id: 'x', active: true, passes: false }] });
  assert.equal(d.block, true);
  assert.match(d.reason, /x/);
  assert.match(d.reason, /abandoned/);
});

test('decide allows when green, inactive, or abandoned', () => {
  assert.equal(decide({ tasks: [{ id: 'x', active: true, passes: true }] }).block, false);
  assert.equal(decide({ tasks: [{ id: 'x', active: false, passes: false }] }).block, false);
  assert.equal(decide({ tasks: [{ id: 'x', active: true, passes: false, abandoned: true }] }).block, false);
});

const HOOK = new URL('../bin/greenloop-stop-hook.js', import.meta.url).pathname;

function runHook(cwd, input) {
  return spawnSync(process.execPath, [HOOK], { encoding: 'utf8', input: JSON.stringify(input), cwd });
}

test('hook CLI exits 2 with reason when red, 0 when no progress.json', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'greenloop-hook-'));
  assert.equal(runHook(cwd, { cwd }).status, 0); // no progress.json -> allow

  writeFileSync(join(cwd, 'progress.json'), JSON.stringify({
    tasks: [{ id: 'red-task', active: true, passes: false }],
  }));
  const r = runHook(cwd, { cwd, stop_hook_active: true });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /red-task/);
});
