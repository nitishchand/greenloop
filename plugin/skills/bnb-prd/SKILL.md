---
name: bnb-prd
description: The PRD gap-hunting iteration loop — read the whole PRD, hunt gaps in the stitched user journey, ask one question at a time, end each pass with a gap count. Exits only at zero gaps AND user-declared final.
---

# bnb-prd — the gap-hunting loop

## Hard rules

1. Read the **entire** current `prd.md` at the start of every pass. No skimming, no diffs.
2. Ask about gaps **one at a time**. Wait for the answer, fold it back into the PRD, then
   ask the next. Never batch questions.
3. Every screen gets an `S-NN` block (Purpose / Elements / Behaviour / Design notes) with a
   populated `testIDs[]` list, named per the profile's conventions doc. A screen without
   testIDs is itself a gap — the PRD must be E2E-ready by construction.
4. End every pass by appending to the PRD's Gaps log: `pass N — gaps found: M`.
5. Exit only when BOTH hold: a full pass finds zero gaps, AND the user explicitly says the
   PRD is final. Then set the PRD Status line to `final`.

## The loop (one pass)

1. Read all of `prd.md`.
2. Walk every user journey end to end, per role, hunting the gap taxonomy below.
3. For each gap found: ask the user about it (one at a time). They may answer in-chat or
   edit flows/schemas by hand — re-read what they changed and reconcile.
4. Fold every answer back into the PRD in place (screen blocks, lifecycle, permissions
   matrix), keeping the S-NN format.
5. Append the pass line to the Gaps log. If M > 0, start the next pass.

## Gap taxonomy

- **Dead ends** — a journey step with no way forward or back; success/cancel paths that go nowhere.
- **Unspecified states** — empty, loading, error, offline, first-run, and "zero items" states.
- **Role/permission holes** — an action with no row in the permissions matrix; screens never
  specified for a role that can reach them.
- **Data lifecycle gaps** — entities that can be created but never edited, archived, or
  deleted; orphaned children on delete.
- **Cross-screen consistency** — the same entity shown with different fields/affordances on
  different screens without a stated reason.

## Red flags

| Thought | Reality |
|---|---|
| "I'll ask these 5 questions together" | Batched questions get shallow answers. One at a time. |
| "One pass was clean, declare final" | The user declares final, not you — and only after a zero-gap pass. |
| "This screen is obvious, skip testIDs" | Not E2E-ready = not done. Every screen, every time. |
| "User said 'looks good'" | "Looks good" ≠ "final". Ask explicitly. |
| "I remember the PRD from last pass" | Re-read it. The user may have edited by hand. |
