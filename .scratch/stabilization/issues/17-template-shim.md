# 17 — Template shim for MeasuredTemplate-style updates

**What to build:** The weapon range template's placement still resolves to a Region, as it does on Foundry 14. It now
also accepts the MeasuredTemplate-style update that the reference modules send. lancer-weapon-fx's manual area macros
then put their colour and size on the map again. This repairs the one break of the public surface we already caused.

**Blocked by:** 10 — Smoke run: area templates

**Status:** ready-for-agent

Spec: `.scratch/stabilization/spec.md`, user story 52 and section "Public surface (ADR-0002) → Template shim".

- [ ] A test step in the smoke run, written first, makes a weapon-fx-style macro call. It places a template from a
      range and updates it with `fillColor`, `distance` and `texture`. The step fails on today's code.
- [ ] `fillColor` lands as the Region's colour.
- [ ] `distance` lands as the size of the Region's shapes, converted from grid units to pixels for each shape type.
- [ ] `texture` has no field in the Region schema. It is kept in the document's flags, and a deprecation warning is
      logged once that names the removal version. The deprecation period follows ADR-0002.
- [ ] The shim's warning shows in the deprecation report's own section for Lancer's warnings to modules. It does not
      trip the deprecation gate.
- [ ] The test step passes after the change.
- [ ] An update without these legacy fields behaves exactly as before.
- [ ] The shim is listed in the public surface as the documented form for this call.
