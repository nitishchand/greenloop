import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('..', import.meta.url).pathname;
const PROFILE = 'profiles/expo-react-native';
const read = (p) => readFileSync(`${root}${p}`, 'utf8');
const json = (p) => JSON.parse(read(p));

test('verifier.json has the four layers with the spec step names', () => {
  const v = json(`${PROFILE}/verifier.json`);
  assert.deepEqual(v.typecheck.map((s) => s.name), ['mobile-tsc', 'backend-tsc']);
  assert.deepEqual(v.unit.map((s) => s.name), ['mobile-jest', 'backend-jest']);
  assert.deepEqual(v.preflight.map((s) => s.name), ['backend-up', 'simulator-booted', 'metro-up']);
  assert.equal(v.e2e.adapter, 'maestro-ios');
  assert.match(v.e2e.run, /\{flow\}/);
  for (const step of [...v.typecheck, ...v.unit]) {
    assert.ok(step.run.length > 0, `${step.name} run`);
  }
  for (const check of v.preflight) {
    assert.ok(check.run.length > 0 && check.fixHint.length > 0, `${check.name} run+fixHint`);
  }
});

test('toolbelt.md covers screen, view tree, logs, and the log-watcher pattern', () => {
  const toolbelt = read(`${PROFILE}/toolbelt.md`);
  for (const marker of ['screenshot', 'maestro hierarchy', 'collect_app_logs', 'subagent']) {
    assert.ok(toolbelt.includes(marker), `toolbelt must mention ${marker}`);
  }
});

test('conventions.md pins testID naming, flow location, and wait discipline', () => {
  const conventions = read(`${PROFILE}/conventions.md`);
  for (const marker of ['testID', '.maestro/', 'clearState', 'extendedWaitUntil']) {
    assert.ok(conventions.includes(marker), `conventions must mention ${marker}`);
  }
});

test('doctor.json covers the spec §4 environment checks with fix hints', () => {
  const doctor = json(`${PROFILE}/doctor.json`);
  const names = doctor.map((c) => c.name);
  for (const expected of ['node', 'docker', 'simctl', 'simulator-booted', 'maestro', 'metro-up', 'accessibility-reminder']) {
    assert.ok(names.includes(expected), `missing doctor check ${expected}`);
  }
  for (const check of doctor) {
    assert.ok(check.run.length > 0, `${check.name} run`);
    assert.ok(check.fixHint.length > 0, `${check.name} fixHint`);
  }
});
