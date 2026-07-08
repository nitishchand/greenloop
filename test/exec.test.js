import test from 'node:test';
import assert from 'node:assert/strict';
import { runShell, tail } from '../src/core/exec.js';

test('runShell captures exit code and merged output', () => {
  const ok = runShell('echo out; echo err 1>&2; exit 0');
  assert.equal(ok.code, 0);
  assert.match(ok.output, /out/);
  assert.match(ok.output, /err/);
  assert.equal(runShell('exit 7').code, 7);
});

test('runShell kills a command that exceeds its timeout', () => {
  const r = runShell('sleep 5', { timeout: 300 });
  assert.notEqual(r.code, 0);
  assert.match(r.output, /timed out after 300ms/);
});

test('tail returns the last N lines', () => {
  assert.equal(tail('a\nb\nc\nd\n', 2), 'c\nd');
  assert.equal(tail('one', 5), 'one');
});
