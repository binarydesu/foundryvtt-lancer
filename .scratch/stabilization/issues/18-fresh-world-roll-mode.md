# 18 — Roll mode on a fresh world

**What to build:** On a fresh world the core roll-mode setting is unset. Lancer then falls back to a chat-message
roll-mode API that Foundry removes in version 16. After this ticket, roll-mode normalization handles the unset setting
itself, so chat cards keep posting when Foundry 16 arrives.

**Blocked by:** 04 — Deprecation gate; 08 — Smoke run: the remaining flows; 12 — Vitest and the first Foundry-free
modules

**Status:** ready-for-agent

Spec: `.scratch/stabilization/spec.md`, user story 54 and section "Known breaks and fresh-world bugs".

- [ ] The unit test for the unset roll-mode setting from ticket 12 fails before the change and passes after it.
- [ ] On a fresh world, the smoke run's deprecation report no longer lists the roll-mode fallback.
- [ ] Every flow card in the smoke run still posts with the expected roll mode.
- [ ] A world with an explicit roll-mode setting behaves as before.
