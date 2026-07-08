import { activeRedTasks } from '../core/progress.js';

export function decide(progress) {
  const red = activeRedTasks(progress);
  if (red.length === 0) return { block: false };
  const ids = red.map((t) => t.id).join(', ');
  return {
    block: true,
    reason:
      `Active task(s) not green: ${ids}. Keep going: fix the FEATURE and run ` +
      `greenloop-verify <task-id> until it exits 0. Do NOT weaken the verifier or the E2E flows. ` +
      `To stop legitimately, set "abandoned": true on the task in progress.json (a recorded decision).`,
  };
}
