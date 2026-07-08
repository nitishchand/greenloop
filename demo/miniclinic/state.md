# miniclinic — Project State

> Read this file at the start of every session, before touching code.
> Update it at **every checkpoint** (end of each verified feature) — it is the shared memory
> between sessions.

**Last updated:** 2026-07-08
**Profile:** expo-react-native

## Stack

Scaffolded from the expo-react-native profile: Expo + expo-router mobile app, Express
backend, npm-workspaces monorepo. Deviation from the profile default: the patients store is
**in-memory** (no Prisma model wired) — deliberate, so the demo has zero migration steps.

## Architecture decisions

Approved for the demo: single role; two screens (S-01 list, S-02 add); API =
`GET /patients` + `POST /patients` on :3001; no offline support (demo runs against the
local backend); data resets on backend restart by design.

## Status by area

| Area | Status | Notes |
|---|---|---|
| S-01/S-02 + patients API | implemented, not yet verified | task `s01-patient-list` at rest; the dogfood run arms it and chases green |

## Conventions

Profile defaults throughout (see the profile's conventions.md). testIDs exactly as in
prd.md.

## Gotchas

- `EXPO_PUBLIC_API_URL` must be the Mac's LAN IP for a physical device; the simulator is
  fine with the localhost default.
- The Maestro flow asserts the added patient by **text** ("Asha Rao"), not row testID,
  because the backend's in-memory list survives app `clearState`.
