import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { CHECKS } from '../src/installer/checks.js';
import { runInstaller } from '../src/installer/run.js';

const quiet = () => {};

test('checks cover the §3 dependency list; only maestro auto-installs', () => {
  const names = CHECKS.map((c) => c.name);
  for (const expected of ['claude', 'node', 'docker', 'simctl', 'maestro']) {
    assert.ok(names.includes(expected), `missing check ${expected}`);
  }
  assert.deepEqual(CHECKS.filter((c) => c.autoInstall).map((c) => c.name), ['maestro']);
  for (const check of CHECKS) assert.ok(check.run && check.fixHint, check.name);
});

// exec fake: failures = set of command substrings that exit 1 (mutable between laps)
function fakeExec(failing, calls = []) {
  return Object.assign((cmd) => {
    calls.push(cmd);
    const failed = [...failing].some((f) => cmd.includes(f));
    return { code: failed ? 1 : 0, output: '' };
  }, { calls });
}

test('all green: registers plugin then MCP, returns 0', () => {
  const exec = fakeExec(new Set());
  const code = runInstaller({ exec, log: quiet, ask: async () => '', packageRoot: '/pkg' });
  return code.then((c) => {
    assert.equal(c, 0);
    const joined = exec.calls.join('\n');
    assert.match(joined, /claude plugin marketplace add \/pkg/);
    assert.match(joined, /claude plugin install bnb@breathe-and-build/);
    assert.match(joined, /claude mcp add --transport http expo https:\/\/mcp\.expo\.dev\/mcp/);
    assert.ok(
      joined.indexOf('plugin install') < joined.indexOf('mcp add'),
      'plugin registered before MCP',
    );
  });
});

test('checkOnly with a failure: returns 3, no registration commands', async () => {
  const exec = fakeExec(new Set(['docker info']));
  const lines = [];
  const code = await runInstaller({
    exec, log: (m) => lines.push(m), ask: async () => '', checkOnly: true, packageRoot: '/pkg',
  });
  assert.equal(code, 3);
  assert.ok(!exec.calls.some((c) => c.includes('plugin install')));
  assert.match(lines.join('\n'), /Docker Desktop/);
});

test('maestro missing + autoYes: runs the auto-install, re-checks, proceeds', async () => {
  const failing = new Set(['maestro -v']);
  const exec = Object.assign((cmd) => {
    exec.calls.push(cmd);
    if (cmd.includes('get.maestro.mobile.dev')) {
      failing.delete('maestro -v'); // install "succeeds"
      return { code: 0, output: '' };
    }
    return { code: [...failing].some((f) => cmd.includes(f)) ? 1 : 0, output: '' };
  }, { calls: [] });
  const code = await runInstaller({ exec, log: quiet, ask: async () => '', autoYes: true, packageRoot: '/pkg' });
  assert.equal(code, 0);
  assert.ok(exec.calls.some((c) => c.includes('get.maestro.mobile.dev')));
  assert.ok(exec.calls.some((c) => c.includes('plugin install')));
});

test('user quits the re-check loop: returns 3, nothing registered', async () => {
  const exec = fakeExec(new Set(['docker info']));
  const code = await runInstaller({ exec, log: quiet, ask: async () => 'q', packageRoot: '/pkg' });
  assert.equal(code, 3);
  assert.ok(!exec.calls.some((c) => c.includes('plugin')));
});

test('integration: --check exits 0 with stubbed toolchain on PATH', () => {
  const stubDir = mkdtempSync(join(tmpdir(), 'bnb-stub-'));
  for (const tool of ['claude', 'docker', 'xcrun', 'maestro']) {
    const stub = join(stubDir, tool);
    writeFileSync(stub, '#!/bin/sh\nexit 0\n');
    chmodSync(stub, 0o755);
  }
  const CLI = new URL('../installer/index.js', import.meta.url).pathname;
  const r = spawnSync(process.execPath, [CLI, '--check'], {
    encoding: 'utf8',
    env: { ...process.env, PATH: `${stubDir}:${process.env.PATH}` },
  });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stderr, /✓ claude/);
});
