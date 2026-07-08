# expo-react-native — conventions

## testIDs

- Naming: `<screen>-<element>` kebab-case (`login-submit`, `home-screen`, `patient-list-row`).
- Declared in the PRD's S-NN block `testIDs[]` first, then attached as **literal** `testID`
  props — never computed/interpolated at runtime; Maestro matches literals, and the
  PRD-to-flow chain breaks if the strings drift.
- Every screen root gets a `<screen>-screen` testID so flows can assert arrival.

## E2E flows (Maestro)

- Location: `apps/mobile/.maestro/<feature>.yaml` — one flow per task; record the path in
  the task's `flow` field in `progress.json`.
- Every flow starts from a clean slate:

  ```yaml
  appId: {{BUNDLE_ID}}
  ---
  - launchApp:
      clearState: true
  ```

- Network-gated UI waits use `extendedWaitUntil` (visible + timeout) — never fixed sleeps:

  ```yaml
  - extendedWaitUntil:
      visible:
        id: "home-screen"
      timeout: 10000
  ```

- A flow covers the task's `acceptance[]` items, nothing more. Cross-feature journeys get
  their own task.

## Code layout & idioms

- Routing: expo-router file routes — screens live in `apps/mobile/app/`.
- Shared types/utils: `packages/shared` (imported by both mobile and backend).
- State: Zustand for client state; TanStack Query for server state; WatermelonDB for
  offline-first entities (sync strategy comes from the architecture phase, not ad hoc).
- Styling: co-located StyleSheet objects; copy the idiom of the nearest existing screen
  before inventing a new one.
- Backend: Express routes thin, logic in modules; Prisma is the only DB access path.
