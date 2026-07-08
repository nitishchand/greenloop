import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';

const root = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(`${root}${p}`, 'utf8');
const json = (p) => JSON.parse(read(p));

test('plugin manifest is valid and named bnb', () => {
  const manifest = json('plugin/.claude-plugin/plugin.json');
  assert.equal(manifest.name, 'bnb');
  assert.equal(manifest.version, json('package.json').version);
  assert.ok(manifest.description.length > 0);
});

const COMMANDS = ['bnb', 'idea', 'prd', 'architecture', 'scaffold', 'feature', 'overnight', 'doctor'];
const SKILL_ROUTED = { prd: 'bnb-prd', architecture: 'bnb-architecture', feature: 'bnb-feature', overnight: 'bnb-overnight' };

function frontmatter(body) {
  const match = body.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(match, 'missing frontmatter');
  return match[1];
}

// An unquoted YAML value containing ': ' fails to parse and Claude Code silently drops ALL
// frontmatter fields (caught for real by `claude plugin validate`). Guard against regression.
function assertYamlSafe(fm, file) {
  for (const line of fm.split('\n')) {
    const value = line.replace(/^[\w-]+:\s*/, '');
    if (value.startsWith('"') || value.startsWith("'")) continue;
    assert.ok(!/:\s/.test(value), `${file}: unquoted frontmatter value contains a colon — quote it: ${line}`);
  }
}

test('every command and skill frontmatter is YAML-safe', () => {
  for (const c of COMMANDS) {
    assertYamlSafe(frontmatter(read(`plugin/commands/${c}.md`)), `${c}.md`);
  }
  for (const s of readdirSync(`${root}plugin/skills`)) {
    assertYamlSafe(frontmatter(read(`plugin/skills/${s}/SKILL.md`)), s);
  }
});

test('exactly the 8 phase commands exist', () => {
  const files = readdirSync(`${root}plugin/commands`).sort();
  assert.deepEqual(files, COMMANDS.map((c) => `${c}.md`).sort());
});

test('every command has a non-empty description in frontmatter', () => {
  for (const c of COMMANDS) {
    const fm = frontmatter(read(`plugin/commands/${c}.md`));
    assert.match(fm, /description:\s*\S+/, `${c}.md description`);
  }
});

test('feature and overnight declare argument hints', () => {
  for (const c of ['feature', 'overnight']) {
    assert.match(frontmatter(read(`plugin/commands/${c}.md`)), /argument-hint:\s*\S+/, `${c}.md`);
  }
});

test('skill-routed commands name their skill', () => {
  for (const [c, skill] of Object.entries(SKILL_ROUTED)) {
    assert.ok(read(`plugin/commands/${c}.md`).includes(skill), `${c}.md must route to ${skill}`);
  }
});

function assertSkill(name, markers) {
  const body = read(`plugin/skills/${name}/SKILL.md`);
  const fm = frontmatter(body);
  assert.match(fm, new RegExp(`name:\\s*${name}\\s*$`, 'm'), `${name} frontmatter name`);
  assert.match(fm, /description:\s*\S+/, `${name} description`);
  for (const marker of markers) {
    assert.match(body, marker, `${name} must contain ${marker}`);
  }
}

test('bnb-prd skill: gap-hunting loop discipline', () => {
  assertSkill('bnb-prd', [/gaps found:/, /red.flags/i, /one at a time/i, /testIDs/]);
});

test('bnb-architecture skill: default profile + warn on override', () => {
  assertSkill('bnb-architecture', [/expo-react-native/, /warn/i, /red.flags/i, /offline/i]);
});

test('bnb-feature skill: green loop with anti-reward-hacking rules', () => {
  assertSkill('bnb-feature', [
    /bnb-verify/, /reward hacking/i, /commit the flow/i, /subagent/i, /red.flags/i, /never edit .?passes/i,
  ]);
});

test('bnb-debugging skill: evidence-first with debug.md citation', () => {
  assertSkill('bnb-debugging', [/debug\.md/, /see Bug/i, /subagent/i, /red.flags/i, /evidence/i]);
});

test('bnb-overnight skill: spiritual-guide fallback + wake-up ritual', () => {
  assertSkill('bnb-overnight', [/spiritual-guide\.md/, /bnb-loop/, /wake-up ritual/i, /red.flags/i]);
});

test('exactly the 5 self-contained skills ship in the plugin', () => {
  const skills = readdirSync(`${root}plugin/skills`).sort();
  assert.deepEqual(skills, ['bnb-architecture', 'bnb-debugging', 'bnb-feature', 'bnb-overnight', 'bnb-prd']);
});

test('README documents the plugin install', () => {
  assert.match(read('README.md'), /bnb@breathe-and-build/);
});

const TEMPLATES = [
  'prd.md', 'state.md', 'debug.md', 'progress.json',
  'spiritual-guide.md', 'remaining-tasks.md', 'CLAUDE.md',
];

test('all 7 artifact templates exist', () => {
  for (const t of TEMPLATES) {
    assert.ok(existsSync(`${root}plugin/templates/${t}`), `missing template ${t}`);
  }
});

test('prd template carries the screen-spec format with testIDs', () => {
  const prd = read('plugin/templates/prd.md');
  assert.match(prd, /S-01/);
  assert.match(prd, /testIDs/);
  assert.match(prd, /Gaps log/i);
});

test('progress template parses with an empty tasks array', () => {
  const progress = json('plugin/templates/progress.json');
  assert.deepEqual(progress.tasks, []);
});

test('CLAUDE.md template enforces the verify gate and sole-writer rule', () => {
  const claudeMd = read('plugin/templates/CLAUDE.md');
  assert.match(claudeMd, /bnb-verify/);
  assert.match(claudeMd, /passes/);
});

test('spiritual-guide template has at least 4 prompt sections', () => {
  const guide = read('plugin/templates/spiritual-guide.md');
  assert.ok(guide.split('\n').filter((l) => l.startsWith('## ')).length >= 4);
});

test('marketplace lists the bnb plugin sourced from ./plugin', () => {
  const marketplace = json('.claude-plugin/marketplace.json');
  assert.equal(marketplace.name, 'breathe-and-build');
  assert.equal(marketplace.plugins.length, 1);
  const [entry] = marketplace.plugins;
  assert.equal(entry.name, 'bnb');
  assert.equal(entry.source, './plugin');
  assert.ok(statSync(`${root}plugin`).isDirectory());
});
