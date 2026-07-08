import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ci = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');

test('unit job gates push and PR on both OSes', () => {
  assert.match(ci, /^  unit:/m);
  assert.match(ci, /push:/);
  assert.match(ci, /pull_request:/);
  assert.match(ci, /ubuntu-latest/);
  assert.match(ci, /macos-latest/);
  assert.match(ci, /npm test/);
});

test('dogfood job is dispatch-only and runs the §12 loop', () => {
  assert.match(ci, /^  dogfood:/m);
  assert.match(ci, /workflow_dispatch/);
  assert.match(ci, /greenloop-loop(\.js)? s01-patient-list/);
  assert.match(ci, /greenloop-verify(\.js)? s01-patient-list/);
  // the dogfood job must not run on push/PR — only the dispatch guard allows it
  assert.match(ci, /if: github\.event_name == 'workflow_dispatch'/);
});
