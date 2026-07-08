import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadProgress, findTask, setPasses } from './progress.js';
import { runShell, tail } from './exec.js';

export const EXIT = { GREEN: 0, RED: 1, ENV: 3, USAGE: 9 };

export function runVerify(taskId, { cwd, config, progressPath, exec = runShell, log = console.error }) {
  let progress;
  try {
    progress = loadProgress(progressPath);
  } catch {
    log(`greenloop-verify: cannot read ${progressPath}`);
    return EXIT.USAGE;
  }
  const task = taskId ? findTask(progress, taskId) : null;
  if (!task) {
    log(`greenloop-verify: unknown task '${taskId ?? ''}'`);
    return EXIT.USAGE;
  }

  const resultsDir = join(cwd, config.resultsDir ?? '.greenloop/results', taskId);
  mkdirSync(resultsDir, { recursive: true });
  const tailLines = config.tailLines ?? 40;
  const v = config.verifier ?? {};
  // No layer may hang the loop: a wedged command (e.g. Maestro waiting on an app that
  // was never installed) is killed and treated as a failure of that layer.
  const stepTimeout = (config.stepTimeoutMinutes ?? 10) * 60_000;

  const fail = (layer, name, code, output, logFile) => {
    writeFileSync(join(resultsDir, logFile), output);
    setPasses(progressPath, taskId, false);
    log(`✗ ${layer}/${name} failed (exit ${code}) — failing tail:`);
    log(tail(output, tailLines));
    return EXIT.RED;
  };

  for (const step of [
    ...(v.typecheck ?? []).map((s) => ({ ...s, layer: 'typecheck' })),
    ...(v.unit ?? []).map((s) => ({ ...s, layer: 'unit' })),
  ]) {
    const { code, output } = exec(step.run, { cwd, timeout: stepTimeout });
    if (code !== 0) return fail(step.layer, step.name, code, output, `${step.name}.log`);
    writeFileSync(join(resultsDir, `${step.name}.log`), output);
  }

  for (const check of v.preflight ?? []) {
    const { code } = exec(check.run, { cwd, timeout: stepTimeout });
    if (code !== 0) {
      log(`✗ env preflight '${check.name}' failed — environment not ready (exit 3, not a code failure)`);
      if (check.fixHint) log(`  fix: ${check.fixHint}`);
      return EXIT.ENV;
    }
  }

  if (v.e2e) {
    if (!task.flow) {
      log(`greenloop-verify: task '${taskId}' has no 'flow' path but e2e is configured`);
      return EXIT.USAGE;
    }
    const { code, output } = exec(v.e2e.run.replaceAll('{flow}', task.flow), { cwd, timeout: stepTimeout });
    if (code !== 0) return fail('e2e', v.e2e.adapter ?? 'e2e', code, output, 'e2e.log');
    writeFileSync(join(resultsDir, 'e2e.log'), output);
  }

  setPasses(progressPath, taskId, true);
  log(`✓ green — all layers passed for '${taskId}'`);
  return EXIT.GREEN;
}
