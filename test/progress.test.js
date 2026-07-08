import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  loadProgress, saveProgress, findTask, setPasses, appendReflexion, activeRedTasks,
} from '../src/core/progress.js';

function fixture(tasks) {
  const dir = mkdtempSync(join(tmpdir(), 'bnb-'));
  const path = join(dir, 'progress.json');
  writeFileSync(path, JSON.stringify({ tasks }));
  return path;
}

test('loadProgress + findTask', () => {
  const path = fixture([{ id: 'a', passes: false }]);
  const p = loadProgress(path);
  assert.equal(findTask(p, 'a').id, 'a');
  assert.equal(findTask(p, 'nope'), null);
});

test('setPasses flips only the named task and persists', () => {
  const path = fixture([{ id: 'a', passes: false }, { id: 'b', passes: false }]);
  setPasses(path, 'a', true);
  const p = loadProgress(path);
  assert.equal(findTask(p, 'a').passes, true);
  assert.equal(findTask(p, 'b').passes, false);
});

test('setPasses throws on unknown task', () => {
  const path = fixture([]);
  assert.throws(() => setPasses(path, 'ghost', true), /unknown task 'ghost'/);
});

test('appendReflexion creates the array when absent', () => {
  const path = fixture([{ id: 'a' }]);
  appendReflexion(path, 'a', { symptom: 's', hypothesis: 'h', fix: 'f' });
  assert.equal(loadProgress(path).tasks[0].reflexions.length, 1);
});

test('activeRedTasks excludes passing, inactive and abandoned tasks', () => {
  const p = { tasks: [
    { id: 'red', active: true, passes: false },
    { id: 'green', active: true, passes: true },
    { id: 'off', active: false, passes: false },
    { id: 'gone', active: true, passes: false, abandoned: true },
  ] };
  assert.deepEqual(activeRedTasks(p).map(t => t.id), ['red']);
});

test('saveProgress writes 2-space JSON with trailing newline', () => {
  const path = fixture([]);
  saveProgress(path, { tasks: [] });
  assert.equal(readFileSync(path, 'utf8'), '{\n  "tasks": []\n}\n');
});
