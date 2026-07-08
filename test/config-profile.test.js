import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadConfig } from '../src/core/config.js';

function project(config) {
  const cwd = mkdtempSync(join(tmpdir(), 'greenloop-cfg-'));
  writeFileSync(join(cwd, 'greenloop.config.json'), JSON.stringify(config));
  return cwd;
}

test('no profile field -> config returned untouched', () => {
  const cwd = project({ verifier: { unit: [{ name: 'u', run: 'x' }] } });
  assert.deepEqual(loadConfig(cwd), { verifier: { unit: [{ name: 'u', run: 'x' }] } });
});

test('profile without project verifier -> profile layers resolved', () => {
  const cwd = project({ profile: 'expo-react-native' });
  const config = loadConfig(cwd);
  assert.equal(config.verifier.typecheck[0].name, 'mobile-tsc');
  assert.equal(config.verifier.e2e.adapter, 'maestro-ios');
  assert.ok(config.doctor.some((c) => c.name === 'maestro'));
});

test('project verifier key replaces the profile key wholesale, others inherited', () => {
  const cwd = project({
    profile: 'expo-react-native',
    verifier: { unit: [{ name: 'only-mine', run: 'npm test' }] },
  });
  const { verifier } = loadConfig(cwd);
  assert.deepEqual(verifier.unit.map((s) => s.name), ['only-mine']);
  assert.deepEqual(verifier.typecheck.map((s) => s.name), ['mobile-tsc', 'backend-tsc']);
  assert.equal(verifier.e2e.adapter, 'maestro-ios');
});

test('project doctor wins wholesale over the profile doctor', () => {
  const cwd = project({ profile: 'expo-react-native', doctor: [{ name: 'mine', run: 'true' }] });
  assert.deepEqual(loadConfig(cwd).doctor.map((c) => c.name), ['mine']);
});

test('unknown profile throws', () => {
  const cwd = project({ profile: 'ghost' });
  assert.throws(() => loadConfig(cwd), /unknown profile 'ghost'/);
});

test('greenloop-verify CLI surfaces an unknown profile as exit 9 with the real message', () => {
  const cwd = project({ profile: 'ghost' });
  const CLI = new URL('../bin/greenloop-verify.js', import.meta.url).pathname;
  const r = spawnSync(process.execPath, [CLI, 't1'], { cwd, encoding: 'utf8' });
  assert.equal(r.status, 9);
  assert.match(r.stderr, /unknown profile 'ghost'/);
});

test('greenloop-doctor CLI runs the merged config (project doctor override)', () => {
  const cwd = project({
    profile: 'expo-react-native',
    doctor: [{ name: 'always-green', run: 'node -e "process.exit(0)"' }],
  });
  const CLI = new URL('../bin/greenloop-doctor.js', import.meta.url).pathname;
  const r = spawnSync(process.execPath, [CLI], { cwd, encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.match(r.stderr, /✓ always-green/);
});
