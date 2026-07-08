import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scaffoldMiniclinic } from '../demo/scaffold-miniclinic.js';

const DEMO = new URL('../demo/miniclinic/', import.meta.url).pathname;
const read = (p) => readFileSync(`${DEMO}${p}`, 'utf8');
const quiet = () => {};

// Files deliberately replaced/filled on top of the scaffold (everything else must match
// the templates byte-for-byte — the no-drift guarantee).
const REPLACED = new Set([
  'prd.md',
  'progress.json',
  'state.md',
  'spiritual-guide.md',
  'apps/mobile/app/index.tsx',
  'apps/backend/src/index.ts',
]);

test('committed demo matches a fresh scaffold except the feature files', () => {
  const fresh = mkdtempSync(join(tmpdir(), 'bnb-demo-'));
  const written = scaffoldMiniclinic(fresh, { log: quiet });
  assert.ok(written.length >= 20);
  for (const file of written) {
    if (REPLACED.has(file)) continue;
    assert.equal(
      read(file),
      readFileSync(join(fresh, file), 'utf8'),
      `demo/miniclinic/${file} drifted from the templates — regenerate or update REPLACED`,
    );
  }
});

test('demo task is fully specced and at rest (not armed)', () => {
  const { tasks } = JSON.parse(read('progress.json'));
  assert.equal(tasks.length, 1);
  const [task] = tasks;
  assert.equal(task.id, 's01-patient-list');
  assert.ok(task.spec && task.acceptance.length >= 2 && task.testIDs.length >= 4);
  assert.equal(task.flow, 'apps/mobile/.maestro/s01-patient-list.yaml');
  assert.equal(task.active, false);
  assert.equal(task.passes, false);
});

test('flow exercises the declared testIDs with clearState + extendedWaitUntil', () => {
  const flow = read('apps/mobile/.maestro/s01-patient-list.yaml');
  const { tasks } = JSON.parse(read('progress.json'));
  assert.match(flow, /clearState: true/);
  assert.match(flow, /extendedWaitUntil/);
  for (const id of tasks[0].testIDs) {
    assert.ok(flow.includes(id) || read('apps/mobile/app/index.tsx').includes(id) || read('apps/mobile/app/add.tsx').includes(id), `testID ${id} unused`);
  }
});

test('screens carry their testIDs; backend serves the patients endpoints', () => {
  assert.match(read('apps/mobile/app/index.tsx'), /testID="patient-list-screen"/);
  assert.match(read('apps/mobile/app/add.tsx'), /testID="add-patient-screen"/);
  const backend = read('apps/backend/src/patients.ts');
  assert.match(backend, /get\('\/patients'/);
  assert.match(backend, /post\('\/patients'/);
  assert.match(read('apps/backend/src/index.ts'), /patientsRouter/);
});

test('demo PRD is final with the two S-blocks', () => {
  const prd = read('prd.md');
  assert.match(prd, /Status:.*final/);
  assert.match(prd, /S-01/);
  assert.match(prd, /S-02/);
  assert.match(prd, /gaps found: 0/);
});
