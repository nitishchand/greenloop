import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

function substitute(text, vars) {
  return text.replaceAll(/\{\{([A-Z_]+)\}\}/g, (m, key) => vars[key] ?? m);
}

function collect(dir, rel = '') {
  const entries = [];
  for (const entry of readdirSync(join(dir, rel), { withFileTypes: true })) {
    const entryRel = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) entries.push(...collect(dir, entryRel));
    else entries.push(entryRel);
  }
  return entries;
}

// Copies the template tree into targetDir, substituting {{KEY}} in file contents AND path
// segments. Conflict-checks the whole tree before writing a single file — existing projects
// are never partially overwritten.
export function scaffoldProject(templatesDir, targetDir, vars, { log = console.error } = {}) {
  const files = collect(templatesDir).map((rel) => ({ rel, dest: substitute(rel, vars) }));

  for (const { dest } of files) {
    if (existsSync(join(targetDir, dest))) {
      throw new Error(`refusing to scaffold: ${dest} already exists in ${targetDir}`);
    }
  }

  const written = [];
  for (const { rel, dest } of files) {
    const destPath = join(targetDir, dest);
    mkdirSync(dirname(destPath), { recursive: true });
    writeFileSync(destPath, substitute(readFileSync(join(templatesDir, rel), 'utf8'), vars));
    written.push(dest);
  }
  written.sort();
  log(`scaffolded ${written.length} files into ${targetDir}`);
  return written;
}
