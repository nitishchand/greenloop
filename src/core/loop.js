export function bossPrompt(taskId) {
  return `Read progress.json and implement the task '${taskId}' (active:true, passes:false).
Read state.md and debug.md first if you have not this session.
Phases: implement the feature -> author/repair its E2E flow -> run bnb-verify ${taskId} ->
read the exit code + failing tail -> fix the FEATURE and retry.
HARD RULES: do NOT modify the verifier config or any E2E flow to force a pass (reward hacking).
Never wait for the user: if a decision is ambiguous, consult spiritual-guide.md and pick the
best answer consistent with it. Show the bnb-verify exit code as evidence.
Only print DONE when bnb-verify ${taskId} exits 0.`;
}

export function runLoop(taskId, { maxLaps = 20, lap, verify, log = console.error }) {
  for (let n = 1; n <= maxLaps; n += 1) {
    log(`==== bnb-loop lap ${n}/${maxLaps} (${taskId}) ====`);
    try {
      lap(taskId, n);
    } catch (err) {
      log(`(lap ${n} errored: ${err.message} — continuing)`);
    }
    if (verify(taskId) === 0) {
      log(`==== GREEN after ${n} lap(s) ====`);
      return 0;
    }
  }
  log(`==== hit max laps (${maxLaps}) without green ====`);
  return 1;
}
