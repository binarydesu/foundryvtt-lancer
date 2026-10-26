# 12 — Vitest and the first Foundry-free modules

**What to build:** Pure game logic gets fast unit tests that run without Foundry. Three pieces move into Foundry-free
modules (see `CONTEXT.md`):

- the structure and overheat table-to-condition mapping
- the legendary dice rule
- roll-mode normalization

`npm run check` runs their Vitest tests and a check that keeps these modules free of Foundry. An agent can then work
test-first on game logic without starting Foundry.

**Blocked by:** 01 — Fast gates

**Status:** ready-for-agent

Spec: `.scratch/stabilization/spec.md`, user stories 35–36 and section "Testing Decisions → Seam 2".

- [ ] Vitest runs as part of `npm run check` in WSL and in CI.
- [ ] Foundry-free modules are recognizable by a convention the check can read, and the convention is written down.
- [ ] The import check fails when a Foundry-free module imports a Foundry-dependent module, directly or through its
      imports, or touches a Foundry global. A deliberate violation proves this and is then removed.
- [ ] The three pieces are each a Foundry-free module, and the existing callers use them. Game behaviour does not
      change.
- [ ] Each module has tests of its external behaviour: inputs to outputs. There are no Foundry mocks.
- [ ] The roll-mode normalization tests include the case that ticket 18 needs: the core roll-mode setting is unset,
      as on a fresh world. The test may be marked as expected to fail until ticket 18.
- [ ] The type gate shows no new signature, and the build passes.
