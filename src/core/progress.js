import { readFileSync, writeFileSync } from 'node:fs';

export function loadProgress(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function saveProgress(path, data) {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}

export function findTask(progress, id) {
  return (progress.tasks ?? []).find((t) => t.id === id) ?? null;
}

function mutateTask(path, id, fn) {
  const progress = loadProgress(path);
  const task = findTask(progress, id);
  if (!task) throw new Error(`unknown task '${id}'`);
  fn(task);
  saveProgress(path, progress);
}

export function setPasses(path, id, value) {
  mutateTask(path, id, (t) => { t.passes = value; });
}

export function appendReflexion(path, id, entry) {
  mutateTask(path, id, (t) => { (t.reflexions ??= []).push(entry); });
}

export function activeRedTasks(progress) {
  return (progress.tasks ?? []).filter((t) => t.active && !t.passes && !t.abandoned);
}
