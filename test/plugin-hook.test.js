import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const BIN_HOOK = new URL('../bin/bnb-stop-hook.js', import.meta.url).pathname;
const PLUGIN_HOOK = new URL('../plugin/hooks/verify-before-stop.js', import.meta.url).pathname;

function runHook(hook, cwd, input) {
  return spawnSync(process.execPath, [hook], { encoding: 'utf8', input, cwd });
}

function project(tasks) {
  const cwd = mkdtempSync(join(tmpdir(), 'bnb-phook-'));
  if (tasks !== undefined) writeFileSync(join(cwd, 'progress.json'), JSON.stringify({ tasks }));
  return cwd;
}

const FIXTURES = [
  ['no progress.json', project(), 0],
  ['active red task', project([{ id: 'red-task', active: true, passes: false }]), 2],
  ['active green task', project([{ id: 'g', active: true, passes: true }]), 0],
  ['abandoned red task', project([{ id: 'x', active: true, passes: false, abandoned: true }]), 0],
  ['inactive red task', project([{ id: 'x', active: false, passes: false }]), 0],
];

for (const [name, cwd, expected] of FIXTURES) {
  test(`parity: ${name} -> both hooks exit ${expected}`, () => {
    const input = JSON.stringify({ cwd, stop_hook_active: true });
    assert.equal(runHook(BIN_HOOK, cwd, input).status, expected, 'bin hook');
    assert.equal(runHook(PLUGIN_HOOK, cwd, input).status, expected, 'plugin hook');
  });
}

test('parity: invalid stdin JSON -> both hooks fall back to cwd and allow', () => {
  const cwd = project();
  assert.equal(runHook(BIN_HOOK, cwd, 'not json').status, 0);
  assert.equal(runHook(PLUGIN_HOOK, cwd, 'not json').status, 0);
});

test('plugin hook block reason names the task and the abandoned escape', () => {
  const cwd = project([{ id: 'red-task', active: true, passes: false }]);
  const r = runHook(PLUGIN_HOOK, cwd, JSON.stringify({ cwd }));
  assert.equal(r.status, 2);
  assert.match(r.stderr, /red-task/);
  assert.match(r.stderr, /abandoned/);
});

test('hooks.json wires Stop to the script via CLAUDE_PLUGIN_ROOT, and the script exists', () => {
  const hooksPath = new URL('../plugin/hooks/hooks.json', import.meta.url).pathname;
  const config = JSON.parse(readFileSync(hooksPath, 'utf8'));
  const command = config.hooks.Stop[0].hooks[0].command;
  assert.match(command, /\$\{CLAUDE_PLUGIN_ROOT\}\/hooks\/verify-before-stop\.js/);
  assert.ok(existsSync(PLUGIN_HOOK));
});
