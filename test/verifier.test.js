import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runVerify, EXIT } from '../src/core/verifier.js';
import { loadProgress } from '../src/core/progress.js';

const CONFIG = {
  resultsDir: '.bnb/results',
  tailLines: 3,
  verifier: {
    typecheck: [{ name: 'tsc', run: 'fake-tsc' }],
    unit: [{ name: 'jest', run: 'fake-jest' }],
    preflight: [{ name: 'backend', run: 'fake-curl', fixHint: 'docker compose up -d' }],
    e2e: { adapter: 'maestro-ios', run: 'maestro test {flow}' },
  },
};

function setup(task = { id: 't1', flow: 'flows/t1.yaml', passes: false }) {
  const cwd = mkdtempSync(join(tmpdir(), 'bnb-'));
  const progressPath = join(cwd, 'progress.json');
  writeFileSync(progressPath, JSON.stringify({ tasks: [task] }));
  return { cwd, progressPath };
}

// exec fake: map command -> {code, output}; records calls
function fakeExec(map, calls = []) {
  return Object.assign((cmd) => {
    calls.push(cmd);
    return map[cmd] ?? { code: 0, output: `ran ${cmd}\n` };
  }, { calls });
}

const quiet = () => {};

test('unknown task -> USAGE', () => {
  const { cwd, progressPath } = setup();
  const code = runVerify('ghost', { cwd, config: CONFIG, progressPath, exec: fakeExec({}), log: quiet });
  assert.equal(code, EXIT.USAGE);
});

test('typecheck failure -> RED, passes:false, tail printed, log written', () => {
  const { cwd, progressPath } = setup({ id: 't1', flow: 'f.yaml', passes: true });
  const lines = [];
  const exec = fakeExec({ 'fake-tsc': { code: 2, output: 'a\nb\nc\nd\nboom\n' } });
  const code = runVerify('t1', { cwd, config: CONFIG, progressPath, exec, log: (m) => lines.push(m) });
  assert.equal(code, EXIT.RED);
  assert.equal(loadProgress(progressPath).tasks[0].passes, false);
  assert.match(lines.join('\n'), /typecheck\/tsc failed \(exit 2\)/);
  assert.match(lines.join('\n'), /boom/);
  assert.ok(!lines.join('\n').includes('a\nb')); // only the 3-line tail
  assert.ok(existsSync(join(cwd, '.bnb/results/t1/tsc.log')));
  assert.equal(exec.calls.length, 1); // fail-fast: unit never ran
});

test('preflight failure -> ENV, passes untouched, fixHint printed', () => {
  const { cwd, progressPath } = setup({ id: 't1', flow: 'f.yaml', passes: true });
  const lines = [];
  const exec = fakeExec({ 'fake-curl': { code: 1, output: '' } });
  const code = runVerify('t1', { cwd, config: CONFIG, progressPath, exec, log: (m) => lines.push(m) });
  assert.equal(code, EXIT.ENV);
  assert.equal(loadProgress(progressPath).tasks[0].passes, true);
  assert.match(lines.join('\n'), /docker compose up -d/);
});

test('e2e uses the task flow and failure -> RED', () => {
  const { cwd, progressPath } = setup();
  const exec = fakeExec({ 'maestro test flows/t1.yaml': { code: 1, output: 'flow failed\n' } });
  const code = runVerify('t1', { cwd, config: CONFIG, progressPath, exec, log: quiet });
  assert.equal(code, EXIT.RED);
  assert.ok(exec.calls.includes('maestro test flows/t1.yaml'));
  assert.match(readFileSync(join(cwd, '.bnb/results/t1/e2e.log'), 'utf8'), /flow failed/);
});

test('task without flow when e2e configured -> USAGE', () => {
  const { cwd, progressPath } = setup({ id: 't1', passes: false });
  const code = runVerify('t1', { cwd, config: CONFIG, progressPath, exec: fakeExec({}), log: quiet });
  assert.equal(code, EXIT.USAGE);
});

test('all green -> GREEN and passes:true', () => {
  const { cwd, progressPath } = setup();
  const code = runVerify('t1', { cwd, config: CONFIG, progressPath, exec: fakeExec({}), log: quiet });
  assert.equal(code, EXIT.GREEN);
  assert.equal(loadProgress(progressPath).tasks[0].passes, true);
});
