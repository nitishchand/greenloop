import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('package.json declares the installer and the four CLIs', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.deepEqual(
    Object.keys(pkg.bin),
    ['breathe-and-build', 'bnb-verify', 'bnb-doctor', 'bnb-loop', 'bnb-stop-hook'],
  );
  assert.equal(pkg.type, 'module');
  assert.ok(pkg.files.includes('installer'));
});
