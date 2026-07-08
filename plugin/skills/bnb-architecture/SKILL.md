---
name: bnb-architecture
description: Backend design review facilitation — present DB schema, API surface, and offline/sync strategy for the user to challenge; confirm the tech stack; record approved decisions in state.md.
---

# bnb-architecture — design review facilitation

## Hard rules

1. Read the **final** `prd.md` fully before proposing anything. If it is not marked final,
   send the user back to `/bnb:prd`.
2. You facilitate a review, not a lecture: present each area as a proposal the user is
   expected to **challenge and change**. Invite pushback explicitly.
3. Stack confirmation is explicit. Default = `expo-react-native` profile. If the user
   overrides, **warn** that they lose the tuned verifier/toolbelt and (per the honesty
   rule) offer: stay on a supported profile, or proceed off the paved road with a
   best-effort custom `verifier.json` whose quality they own. Never degrade silently.
4. Nothing is decided until the user approves. Record approved decisions in `state.md`
   under "Architecture decisions" — schema summary, API surface, offline/sync strategy,
   confirmed stack.

## The review, area by area

Present in this order, pausing for the user after each:

1. **DB schema** — entities from the PRD's data lifecycle section, keys, relations,
   soft-delete/archive strategy. Show it as a diagram-in-text the user can edit.
2. **API surface** — endpoints per screen block, request/response shapes, auth boundaries
   mapped to the permissions matrix.
3. **Offline/sync strategy** — for any mobile app this is mandatory, not optional: what
   works offline, conflict resolution, sync triggers. "Always online" is a decision the
   user must say out loud.
4. **Stack confirmation** — profile default plus any PRD-driven deviations.

## Red flags

| Thought | Reality |
|---|---|
| "I'll design from the journeys I remember" | Design from the full, final prd.md — re-read it. |
| "expo-react-native obviously, moving on" | The user confirms the stack; the default is a proposal. |
| "Offline is an edge case, skip it" | For mobile, offline/sync is a first-class decision. Ask. |
| "User went quiet, they must agree" | Silence is not approval. The gate is explicit approval recorded in state.md. |
