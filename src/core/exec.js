import { spawnSync } from 'node:child_process';

export function runShell(command, { cwd } = {}) {
  const r = spawnSync(command, {
    shell: true,
    cwd,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  return { code: r.status ?? 1, output: `${r.stdout ?? ''}${r.stderr ?? ''}` };
}

export function tail(text, lines) {
  return text.trimEnd().split('\n').slice(-lines).join('\n');
}
