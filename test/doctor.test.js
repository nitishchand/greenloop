import test from 'node:test';
import assert from 'node:assert/strict';
import { runDoctor } from '../src/core/doctor.js';

const exec = (map) => (cmd) => ({ code: map[cmd] ?? 0, output: '' });

test('all checks pass -> 0', () => {
  const lines = [];
  const code = runDoctor(
    [{ name: 'docker', run: 'docker info' }],
    { exec: exec({}), log: (m) => lines.push(m) },
  );
  assert.equal(code, 0);
  assert.match(lines.join('\n'), /✓ docker/);
});

test('any failure -> 3, all checks still run, fixHint printed', () => {
  const lines = [];
  const code = runDoctor(
    [
      { name: 'docker', run: 'docker info', fixHint: 'Start Docker Desktop' },
      { name: 'node', run: 'node -v' },
    ],
    { exec: exec({ 'docker info': 1 }), log: (m) => lines.push(m) },
  );
  assert.equal(code, 3);
  const out = lines.join('\n');
  assert.match(out, /✗ docker — fix: Start Docker Desktop/);
  assert.match(out, /✓ node/); // did not fail-fast
});
