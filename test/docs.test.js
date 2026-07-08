import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(`${root}${p}`, 'utf8');

const DOCS = {
  'docs/tutorial.md': [/miniclinic/, /greenloop-verify/, /\/greenloop:prd/],
  'docs/playbook.md': [/ccusage/, /failing tail/i, /statusline/i],
  'docs/os-matrix.md': [/maestro-android/, /WSL2/],
  'docs/writing-profiles.md': [/verifier\.json/, /wholesale/i, /\{flow\}/],
  'docs/container-mode.md': [/iOS Simulator cannot run/i, /backend/i],
};

for (const [file, markers] of Object.entries(DOCS)) {
  test(`${file} exists with its key content`, () => {
    const body = read(file);
    for (const marker of markers) assert.match(body, marker);
  });
}

test('README links the docs set and documents the installer', () => {
  const readme = read('README.md');
  for (const doc of Object.keys(DOCS)) assert.ok(readme.includes(doc), `README must link ${doc}`);
  assert.match(readme, /npx greenloop/);
  assert.match(readme, /--check/);
});
