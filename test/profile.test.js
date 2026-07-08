import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const root = new URL('..', import.meta.url).pathname;
const PROFILE = 'profiles/expo-react-native';
const read = (p) => readFileSync(`${root}${p}`, 'utf8');
const json = (p) => JSON.parse(read(p));

const T = `${PROFILE}/templates`;
const TEMPLATE_FILES = [
  'package.json', 'docker-compose.yml', '.env.example', '.gitignore',
  'bnb.config.json', '.claude/settings.json',
  'apps/mobile/package.json', 'apps/mobile/tsconfig.json', 'apps/mobile/app.json',
  'apps/mobile/app/_layout.tsx', 'apps/mobile/app/index.tsx', 'apps/mobile/.maestro/smoke.yaml',
  'apps/backend/package.json', 'apps/backend/tsconfig.json', 'apps/backend/src/index.ts',
  'apps/backend/prisma/schema.prisma', 'apps/backend/Dockerfile',
  'packages/shared/package.json', 'packages/shared/tsconfig.json', 'packages/shared/src/index.ts',
];

test('scaffold template tree is complete and all JSON parses', () => {
  for (const f of TEMPLATE_FILES) {
    assert.ok(existsSync(`${root}${T}/${f}`), `missing template ${f}`);
    if (f.endsWith('.json')) assert.doesNotThrow(() => json(`${T}/${f}`), `${f} must parse`);
  }
});

test('root package.json declares the two workspace globs', () => {
  assert.deepEqual(json(`${T}/package.json`).workspaces, ['apps/*', 'packages/*']);
});

test('docker-compose has the three services, all restart: unless-stopped', () => {
  const compose = read(`${T}/docker-compose.yml`);
  for (const service of ['postgres:', 'redis:', 'backend:']) {
    assert.ok(compose.includes(service), `missing service ${service}`);
  }
  assert.equal(compose.match(/restart: unless-stopped/g)?.length, 3);
});

test('curated allowlist denies rm, git push, and sudo', () => {
  const { permissions } = json(`${T}/.claude/settings.json`);
  for (const denied of ['Bash(rm:*)', 'Bash(git push:*)', 'Bash(sudo:*)']) {
    assert.ok(permissions.deny.includes(denied), `must deny ${denied}`);
  }
  assert.ok(permissions.allow.includes('Bash(bnb-verify:*)'));
});

test('project bnb.config.json binds the profile and leaves verifier to the merge', () => {
  const config = json(`${T}/bnb.config.json`);
  assert.equal(config.profile, 'expo-react-native');
  assert.equal(config.verifier, undefined);
  assert.match(config.loop.allowedTools, /bnb-verify/);
});

test('smoke flow uses clearState and extendedWaitUntil against home-screen', () => {
  const flow = read(`${T}/apps/mobile/.maestro/smoke.yaml`);
  assert.match(flow, /clearState: true/);
  assert.match(flow, /extendedWaitUntil/);
  assert.match(flow, /home-screen/);
});

test('mobile home screen renders its root testID; backend serves /health', () => {
  assert.match(read(`${T}/apps/mobile/app/index.tsx`), /testID="home-screen"/);
  assert.match(read(`${T}/apps/backend/src/index.ts`), /\/health/);
});

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
