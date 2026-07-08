# {{PROJECT_NAME}} — Product Requirements Document

**Status:** draft (the `/bnb:prd` gap-hunting loop ends only when a full pass finds zero gaps
AND you declare this PRD final — then change this line to `final`).

## Vision

{{One paragraph: what this app is, for whom, and the single job it must never fail at.}}

## Users & roles

| Role | Who they are | What they can do |
|---|---|---|
| {{R-01 name}} | {{description}} | {{capabilities}} |

## User journeys

{{Numbered end-to-end journeys, each stitched from the screens below. Every journey must
terminate somewhere — a journey that dead-ends is a gap.}}

## Screens

Every screen gets an `S-NN` block in exactly this shape. The `testIDs[]` list is **required**
(naming per the profile's conventions doc) — it is what makes the spec E2E-ready by
construction. Optionally reference attached Excalidraw/Figma files per block.

> **Example (replace with your own screens):**
>
> ### S-01 Login
>
> - **Purpose:** authenticate a returning user with phone + PIN.
> - **Elements:** phone input, PIN input, submit button, error banner.
> - **Behaviour:** submit disabled until both fields valid; wrong PIN shows error banner
>   without clearing phone; 3 failures → cooldown message. Offline: show cached-session
>   option if available.
> - **Role variants:** *R-01:* lands on home. *R-02 (admin):* lands on dashboard.
> - **Design notes:** keyboard avoids inputs; PIN field masked.
> - **testIDs:** `["login-screen", "login-phone-input", "login-pin-input", "login-submit", "login-error-banner"]`

### S-01 {{Screen name}}

- **Purpose:**
- **Elements:**
- **Behaviour:** {{include empty / loading / error / offline states — unspecified states are gaps}}
- **Role variants:**
- **Design notes:**
- **testIDs:** `[]`

## Data lifecycle

{{For every core entity: how it is created, edited, archived/deleted, and who may do each.
A create-only entity is a gap.}}

## Permissions matrix

| Action | {{R-01}} | {{R-02}} |
|---|---|---|
| {{action}} | ✅ | ❌ |

## Gaps log

The `/bnb:prd` loop appends one line per pass: `pass N — gaps found: M`. The PRD may be
declared final only after a pass with `gaps found: 0`.

- pass 1 — gaps found: —
