// Machine-level preflight for `npx breathe-and-build` (spec §3): everything the build
// phases need, checkable before any project exists. Only Maestro is safe to auto-install;
// the rest get exact copy-paste instructions and a re-check loop — never half-installed.
export const CHECKS = [
  {
    name: 'claude',
    run: 'claude --version',
    fixHint: 'Install Claude Code: npm install -g @anthropic-ai/claude-code (then `claude` once to log in)',
  },
  {
    name: 'node',
    run: 'node -e "process.exit(Number(process.versions.node.split(\'.\')[0]) >= 20 ? 0 : 1)"',
    fixHint: 'Install Node >= 20 (https://nodejs.org or `brew install node`)',
  },
  {
    name: 'docker',
    run: 'docker info',
    fixHint: 'Install and start Docker Desktop: https://docker.com/products/docker-desktop',
  },
  {
    name: 'simctl',
    run: 'xcrun simctl help',
    fixHint: 'Install Xcode from the App Store, then: xcode-select --install and open Xcode once to accept the license',
  },
  {
    name: 'maestro',
    run: 'maestro -v',
    fixHint: 'Install Maestro: curl -fsSL "https://get.maestro.mobile.dev" | bash (then restart the shell)',
    autoInstall: 'curl -fsSL "https://get.maestro.mobile.dev" | bash',
  },
];
