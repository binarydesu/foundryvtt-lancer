# 09 — Smoke run: bonuses, statuses, pilot and mech

**What to build:** The smoke run checks the paths that broke silently before:

- core bonuses and weapon bonuses land on the prepared actor
- status effects toggle on and off
- a linked pilot passes its values down to its mech

**Blocked by:** 03 — Smoke run: harness

**Status:** ready-for-agent

Spec: `.scratch/stabilization/spec.md`, user stories 11–13 and section "Smoke run → Core paths".

- [ ] A core bonus that raises a mech stat changes that stat by the amount the official text gives.
- [ ] A bonus that changes weapon damage or range changes that value.
- [ ] Each expected value is written in the test from the official text, not read back from the system.
- [ ] A status toggled on through the token HUD shows on the actor. Toggled off, it disappears.
- [ ] A mech linked to a pilot shows the pilot's passdown values: grit, HP and the pilot's skills and talents where
      the mech uses them.
- [ ] Unlinking the pilot removes the passdown.
