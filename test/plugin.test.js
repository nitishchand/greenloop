import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';

const root = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(`${root}${p}`, 'utf8');
const json = (p) => JSON.parse(read(p));

test('plugin manifest is valid and named bnb', () => {
  const manifest = json('plugin/.claude-plugin/plugin.json');
  assert.equal(manifest.name, 'bnb');
  assert.equal(manifest.version, json('package.json').version);
  assert.ok(manifest.description.length > 0);
});

const TEMPLATES = [
  'prd.md', 'state.md', 'debug.md', 'progress.json',
  'spiritual-guide.md', 'remaining-tasks.md', 'CLAUDE.md',
];

test('all 7 artifact templates exist', () => {
  for (const t of TEMPLATES) {
    assert.ok(existsSync(`${root}plugin/templates/${t}`), `missing template ${t}`);
  }
});

test('prd template carries the screen-spec format with testIDs', () => {
  const prd = read('plugin/templates/prd.md');
  assert.match(prd, /S-01/);
  assert.match(prd, /testIDs/);
  assert.match(prd, /Gaps log/i);
});

test('progress template parses with an empty tasks array', () => {
  const progress = json('plugin/templates/progress.json');
  assert.deepEqual(progress.tasks, []);
});

test('CLAUDE.md template enforces the verify gate and sole-writer rule', () => {
  const claudeMd = read('plugin/templates/CLAUDE.md');
  assert.match(claudeMd, /bnb-verify/);
  assert.match(claudeMd, /passes/);
});

test('spiritual-guide template has at least 4 prompt sections', () => {
  const guide = read('plugin/templates/spiritual-guide.md');
  assert.ok(guide.split('\n').filter((l) => l.startsWith('## ')).length >= 4);
});

test('marketplace lists the bnb plugin sourced from ./plugin', () => {
  const marketplace = json('.claude-plugin/marketplace.json');
  assert.equal(marketplace.name, 'breathe-and-build');
  assert.equal(marketplace.plugins.length, 1);
  const [entry] = marketplace.plugins;
  assert.equal(entry.name, 'bnb');
  assert.equal(entry.source, './plugin');
  assert.ok(statSync(`${root}plugin`).isDirectory());
});
