# 14 — Untrusted text never reaches the page as markup

**What to build:** Untrusted text (see `CONTEXT.md`) never reaches the page as markup:

- text that a player writes
- text that arrives with an imported content pack or COMP/CON data

Official content keeps its formatting. Existing worlds are cleaned by a migration. In every smoke run, a canary
planted by a player account proves the protection.

The details stay in the private part of the tracker until the fix is pushed, as described under "Undisclosed security
issues" in `docs/agents/issue-tracker.md`. This ticket only tracks that work. Work the private tickets in order. This
ticket closes when the last of them is done.

**Blocked by:** 03 — Smoke run: harness; 12 — Vitest and the first Foundry-free modules

**Status:** ready-for-agent

Spec: `.scratch/stabilization/spec.md`, user stories 41–45 and section "Untrusted text".

- [ ] The three private tickets are done.
- [ ] The fix is pushed to the fork.
- [ ] After the push, the private spec and tickets move into the public tracker and are committed.
- [ ] Every smoke run from then on plants and checks the canaries.
- [ ] The public surface does not change: same data paths, same value types.
