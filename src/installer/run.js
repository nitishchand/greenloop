import { CHECKS } from './checks.js';

function report(results, log) {
  for (const { check, code } of results) {
    if (code === 0) log(`✓ ${check.name}`);
    else log(`✗ ${check.name} — fix: ${check.fixHint}`);
  }
}

export async function runInstaller({
  exec,
  log = console.error,
  ask,
  checkOnly = false,
  autoYes = false,
  packageRoot,
  checks = CHECKS,
}) {
  // 1. Preflight loop — never proceed (and never half-install) until everything is green.
  for (;;) {
    const results = checks.map((check) => ({ check, code: exec(check.run, {}).code }));
    report(results, log);
    const failing = results.filter((r) => r.code !== 0);
    if (failing.length === 0) break;
    if (checkOnly) return 3;

    let installFailed = false;
    for (const { check } of failing) {
      if (!check.autoInstall) continue;
      const answer = autoYes ? 'y' : await ask(`Install ${check.name} now? [y/N] `);
      if (answer.trim().toLowerCase() === 'y' || autoYes) {
        log(`installing ${check.name}...`);
        const { code } = exec(check.autoInstall, {});
        if (code !== 0) {
          installFailed = true;
          log(`✗ ${check.name} auto-install failed — install it manually (see fix above)`);
        }
      }
    }

    const manual = failing.filter((r) => !r.check.autoInstall);
    if (autoYes && manual.length === 0 && installFailed) return 3; // don't spin unattended
    if (manual.length > 0 || !autoYes) {
      const answer = await ask('Apply the fixes above, then press enter to re-check (q to quit): ');
      if (answer.trim().toLowerCase() === 'q') {
        log('Stopping. Nothing was half-installed — re-run `npx greenloop` any time.');
        return 3;
      }
    }
  }
  if (checkOnly) return 0;

  // 2. Register the plugin (ships inside this npm package).
  log('Registering the GreenLoop plugin with Claude Code...');
  exec(`claude plugin marketplace add ${packageRoot}`, {});
  const install = exec('claude plugin install greenloop@greenloop', {});
  log(install.code === 0 ? '✓ plugin greenloop@greenloop installed' : '✗ plugin install failed — run it manually: claude plugin install greenloop@greenloop');

  // 3. Register the Expo MCP server (Metro folds into it; WebFetch is built into Claude Code).
  const mcp = exec('claude mcp add --transport http expo https://mcp.expo.dev/mcp', {});
  log(mcp.code === 0 ? '✓ Expo MCP registered' : '✗ Expo MCP registration failed — run it manually: claude mcp add --transport http expo https://mcp.expo.dev/mcp');
  log('  → authenticate once via /mcp in your next Claude Code session');
  log('  → local capabilities (screenshots, view tree, logs) activate per-project: the profile');
  log('    templates ship expo-mcp as a dev dependency and start Metro with EXPO_UNSTABLE_MCP_SERVER=1');

  // 4. Reminders.
  log('');
  log('REMINDER: grant your terminal/IDE macOS Accessibility permission');
  log('  (System Settings > Privacy & Security > Accessibility) or simulator automation will silently fail.');
  log('OPTIONAL: container mode (backend/web work only — the iOS Simulator cannot run in a');
  log('  Linux container): see docs/container-mode.md in the greenloop repo.');
  log('');
  log('Done. Open Claude Code in an empty project directory and run /greenloop to begin.');
  return 0;
}
