# 21 — Compatibility layer: templates and regions, grid, active-effect change types

**What to build:** The compatibility layer takes over the second group of Foundry APIs that broke before:

- area templates and regions
- grid measurement
- registering active-effect change types

**Blocked by:** 09 — Smoke run: bonuses, statuses, pilot and mech; 10 — Smoke run: area templates; 17 — Template shim
for MeasuredTemplate-style updates

**Status:** ready-for-agent

Spec: `.scratch/stabilization/spec.md`, user story 57 and section "Cleanup → Compatibility layer".

- [ ] If ticket 20 has created the layer, extend it. Otherwise create it with the same interface style, and ticket 20
      extends it later.
- [ ] Every region and template creation, every grid measurement and every active-effect change-type registration
      goes through the layer.
- [ ] The template shim from ticket 17 sits on top of the layer. The shim faces the modules, and the layer faces
      Foundry.
- [ ] The `npm run check` rule against direct calls covers this group too.
- [ ] The smoke run passes unchanged. That includes bonuses, statuses, area templates and the shim step.
- [ ] The type gate shows no new signature.
