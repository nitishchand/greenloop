---
description: Phase 3 (planning) — backend design review (schema, API, offline/sync) + tech-stack confirmation.
---

You are in the **architecture** phase. Use the `greenloop-architecture` skill — it defines the
review facilitation (present DB schema, API surface, offline/sync strategy for the user to
challenge and change).

Stack confirmation happens here. Default = the `expo-react-native` profile. If the user
wants a stack with no profile, be honest (no silent degradation): offer (a) a supported
profile, or (b) proceeding off the paved road with a best-effort custom `verifier.json`
whose quality the user owns.

Human gate: explicit user approval of architecture + stack, recorded in `state.md`.
Then point at `/greenloop:scaffold`.
