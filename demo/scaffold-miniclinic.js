#!/usr/bin/env node
// Regenerates the MiniClinic scaffold base. The committed demo/miniclinic is this output
// plus the feature files (patient screens, patients endpoint, flow, final prd) on top —
// test/demo.test.js asserts the untouched files never drift from the templates.
//
// To regenerate: delete demo/miniclinic, run `node demo/scaffold-miniclinic.js`, then
// restore the feature files from git (git checkout -- demo/miniclinic).
import { fileURLToPath } from 'node:url';
import { scaffoldProject } from '../src/core/scaffold.js';

export const VARS = {
  PROJECT_NAME: 'miniclinic',
  PROFILE: 'expo-react-native',
  DATE: '2026-07-08',
};

const root = fileURLToPath(new URL('..', import.meta.url));

export function scaffoldMiniclinic(targetDir, { log = console.error } = {}) {
  const written = [
    // Stack scaffold from the profile, then the §5 artifact set from the plugin —
    // the same two steps /greenloop:scaffold performs.
    ...scaffoldProject(`${root}profiles/expo-react-native/templates`, targetDir, VARS, { log }),
    ...scaffoldProject(`${root}plugin/templates`, targetDir, VARS, { log }),
  ];
  return written.sort();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  scaffoldMiniclinic(fileURLToPath(new URL('miniclinic', import.meta.url)));
}
