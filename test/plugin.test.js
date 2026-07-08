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

test('marketplace lists the bnb plugin sourced from ./plugin', () => {
  const marketplace = json('.claude-plugin/marketplace.json');
  assert.equal(marketplace.name, 'breathe-and-build');
  assert.equal(marketplace.plugins.length, 1);
  const [entry] = marketplace.plugins;
  assert.equal(entry.name, 'bnb');
  assert.equal(entry.source, './plugin');
  assert.ok(statSync(`${root}plugin`).isDirectory());
});
