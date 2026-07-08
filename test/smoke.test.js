import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('package.json declares the three CLIs', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.deepEqual(Object.keys(pkg.bin), ['bnb-verify', 'bnb-doctor', 'bnb-loop']);
  assert.equal(pkg.type, 'module');
});
