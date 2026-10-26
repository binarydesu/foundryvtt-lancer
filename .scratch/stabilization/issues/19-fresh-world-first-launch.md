# 19 — Clean first launch of a fresh world

**What to build:** A fresh world no longer shows the compendium-manager tour prompt. That prompt is meant for worlds
migrating from versions before 2.7.0. Dialogs opened from the LCP manager also appear in front of it, not hidden
behind it. A GM then never waits on a prompt they cannot see.

**Blocked by:** 03 — Smoke run: harness

**Status:** ready-for-agent

Spec: `.scratch/stabilization/spec.md`, user stories 55–56 and section "Known breaks and fresh-world bugs".

- [ ] A first-launch check in the smoke run is written first. It fails on today's code: the prompt appears on a fresh
      world.
- [ ] On a fresh world, the default of the stored migration version no longer counts as old, and the prompt does not
      appear.
- [ ] A world whose stored migration version is older than 2.7.0 still gets the prompt.
- [ ] A dialog opened from the LCP manager is the topmost window. The smoke run checks this by what is actually on top
      at the dialog's position.
- [ ] The harness no longer has to work around either problem, and the workaround is removed.
