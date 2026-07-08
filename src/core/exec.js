import { spawnSync } from 'node:child_process';

export function runShell(command, { cwd, timeout } = {}) {
  const r = spawnSync(command, {
    shell: true,
    cwd,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    timeout,
    killSignal: 'SIGKILL',
  });
  const timedOut = r.error?.code === 'ETIMEDOUT';
  return {
    code: r.status ?? 1,
    output: `${r.stdout ?? ''}${r.stderr ?? ''}${timedOut ? `\n[greenloop] command timed out after ${timeout}ms and was killed\n` : ''}`,
  };
}

export function tail(text, lines) {
  return text.trimEnd().split('\n').slice(-lines).join('\n');
}
