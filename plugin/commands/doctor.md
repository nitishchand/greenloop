---
description: Environment health check — runs the profile-declared checks and relays the full fix-it list.
---

Run `bnb-doctor` in the project root and relay its output verbatim.

- Exit **0**: environment healthy — say so in one line.
- Exit **3**: present every ✗ line with its fix hint as a checklist; offer to re-run after
  the user applies fixes. Doctor never fails fast — the list is complete.
- Exit **9**: no `bnb.config.json` here — this project isn't scaffolded yet; point at `/bnb`
  to find the current phase.

Doctor checks environment readiness (simulator, Docker, MCPs, tools), never code health —
code failures belong to `bnb-verify`.
