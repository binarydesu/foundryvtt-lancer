# 13 — Content parsing under test

**What to build:** Two kinds of parsing become Foundry-free modules with unit tests on recorded data:

- **LCP content packs, both v2 and v3.** This includes the NPC collection files and both weapon-damage shapes.
- **COMP/CON pilot data.**

Content import has broken silently before, and COMP/CON import cannot run in the smoke run because it needs an
external service.

**Blocked by:** 12 — Vitest and the first Foundry-free modules

**Status:** ready-for-agent

Spec: `.scratch/stabilization/spec.md`, section "Testing Decisions → Seam 2" and "Smoke run → Out of the run".

- [ ] LCP parsing is a Foundry-free module, and the importer uses it.
- [ ] Tests cover v2 packs.
- [ ] Tests cover v3 packs with per-entry NPC class and template collection files. The tests check that base and
      optional features are linked back to their class.
- [ ] Tests cover both weapon-damage shapes, the older field and the newer field, plus a scalar.
- [ ] A pack that yields zero entries produces the warning.
- [ ] The conversion of COMP/CON pilot data into actor data is a Foundry-free module and is tested on recorded pilot
      data.
- [ ] Fetching from the external service stays outside the module and is not part of any test.
- [ ] Test data is small and recorded in the repository. It holds no copyrighted pack in full, only trimmed excerpts.
- [ ] Importing all official packs in the smoke run still installs every selected pack with the same entry counts as
      before.
