---
description: Phase 2 (planning) — the PRD gap-hunting iteration loop; exits only at zero gaps AND user-declared final.
---

You are in the **prd** phase. Use the `greenloop-prd` skill — it defines the full gap-hunting
loop discipline (read the entire PRD each pass, one question at a time, `gaps found: N`
per pass, screen specs with required testIDs).

Exit condition (both required): a full pass finds **zero gaps**, and the user explicitly
declares the PRD **final**. Then update the PRD Status line to `final` and point at
`/greenloop:architecture`.
