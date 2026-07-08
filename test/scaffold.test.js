import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scaffoldProject } from '../src/core/scaffold.js';

const quiet = () => {};

function templates() {
  const dir = mkdtempSync(join(tmpdir(), 'bnb-tpl-'));
  mkdirSync(join(dir, 'apps/{{NAME}}-app/src'), { recursive: true });
  writeFileSync(join(dir, 'package.json'), '{ "name": "{{NAME}}", "keep": "{{UNKNOWN}}" }');
  writeFileSync(join(dir, 'apps/{{NAME}}-app/src/index.ts'), 'export const app = "{{NAME}}";');
  return dir;
}

test('copies the tree with substitution in content and path segments', () => {
  const target = mkdtempSync(join(tmpdir(), 'bnb-out-'));
  const written = scaffoldProject(templates(), target, { NAME: 'clinic' }, { log: quiet });
  assert.deepEqual(written, ['apps/clinic-app/src/index.ts', 'package.json']);
  assert.match(readFileSync(join(target, 'package.json'), 'utf8'), /"name": "clinic"/);
  assert.match(readFileSync(join(target, 'apps/clinic-app/src/index.ts'), 'utf8'), /"clinic"/);
});

test('unknown markers are left intact', () => {
  const target = mkdtempSync(join(tmpdir(), 'bnb-out-'));
  scaffoldProject(templates(), target, { NAME: 'x' }, { log: quiet });
  assert.match(readFileSync(join(target, 'package.json'), 'utf8'), /\{\{UNKNOWN\}\}/);
});

test('throws before writing anything when a destination file exists', () => {
  const target = mkdtempSync(join(tmpdir(), 'bnb-out-'));
  writeFileSync(join(target, 'package.json'), 'precious');
  assert.throws(
    () => scaffoldProject(templates(), target, { NAME: 'x' }, { log: quiet }),
    /already exists/,
  );
  assert.equal(readFileSync(join(target, 'package.json'), 'utf8'), 'precious');
  assert.equal(existsSync(join(target, 'apps')), false); // nothing else written either
});
