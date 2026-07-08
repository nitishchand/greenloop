# miniclinic — Product Requirements Document

**Status:** final

## Vision

The smallest possible clinic front-desk tool: a receptionist keeps a running list of
patients who checked in today. One list, one add form, one API. MiniClinic exists to
dogfood Breathe-and-Build end to end — every concept (screen specs, testIDs, green loop)
appears exactly once.

## Users & roles

| Role | Who they are | What they can do |
|---|---|---|
| R-01 Receptionist | The only user | View the patient list, add a patient |

## User journeys

1. Receptionist opens the app → sees the patient list (empty state on first run) →
   taps Add → enters a name → saves → returns to the list and sees the new patient.

## Screens

### S-01 Patient list

- **Purpose:** show today's checked-in patients; entry point to adding one.
- **Elements:** header, patient list (one row per patient), empty-state message, add button.
- **Behaviour:** loads `GET /patients` on focus; empty list shows the empty state; rows show
  the patient name; add button navigates to S-02. Loading: list area blank until first
  response. Error: shows the empty state (v1 accepts this — single-user demo). Offline: not
  supported (demo runs against the local backend).
- **Role variants:** none (single role).
- **Design notes:** plain list, no styling ambitions — this is a dogfood app.
- **testIDs:** `["patient-list-screen", "patient-empty", "patient-add-button"]`

### S-02 Add patient

- **Purpose:** capture a patient name and append it to today's list.
- **Elements:** name input, save button.
- **Behaviour:** save is a `POST /patients {name}`; empty name → button does nothing
  (input required); on success → navigate back to S-01, which refetches.
- **Role variants:** none.
- **Design notes:** keyboard opens on mount.
- **testIDs:** `["add-patient-screen", "patient-name-input", "patient-save-button"]`

## Data lifecycle

Patient: created via S-02; read via S-01; never edited or deleted in v1. The list resets
when the backend restarts — in-memory store by design, so the demo needs no migration step.

## Permissions matrix

| Action | R-01 |
|---|---|
| View list | ✅ |
| Add patient | ✅ |

## Gaps log

- pass 1 — gaps found: 3 (empty state unspecified; error behaviour unspecified; data reset
  semantics unspecified)
- pass 2 — gaps found: 0

Declared final by the author (this PRD is the committed dogfood fixture).
