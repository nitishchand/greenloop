import test from 'node:test';
import assert from 'node:assert/strict';
import { runLoop, bossPrompt } from '../src/core/loop.js';

const quiet = () => {};

test('returns 0 on first green verify and stops lapping', () => {
  let laps = 0;
  const results = [1, 1, 0]; // green on 3rd verify
  const code = runLoop('t1', {
    maxLaps: 10,
    lap: () => { laps += 1; },
    verify: () => results.shift(),
    log: quiet,
  });
  assert.equal(code, 0);
  assert.equal(laps, 3);
});

test('returns 1 after maxLaps without green', () => {
  let laps = 0;
  const code = runLoop('t1', { maxLaps: 4, lap: () => { laps += 1; }, verify: () => 1, log: quiet });
  assert.equal(code, 1);
  assert.equal(laps, 4);
});

test('a throwing lap does not abort the loop', () => {
  const results = [0];
  const code = runLoop('t1', {
    maxLaps: 2,
    lap: () => { throw new Error('claude exited non-zero'); },
    verify: () => results.shift() ?? 0,
    log: quiet,
  });
  assert.equal(code, 0);
});

test('bossPrompt names the task, forbids tampering, requires spiritual-guide fallback', () => {
  const p = bossPrompt('s01-login');
  assert.match(p, /s01-login/);
  assert.match(p, /bnb-verify s01-login/);
  assert.match(p, /reward hacking/i);
  assert.match(p, /spiritual-guide\.md/);
});
