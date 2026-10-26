# 15 — Public surface: written list and contract checks

**What to build:** The public surface from ADR-0002 is written down twice:

- `docs/public-api.md` for people
- a machine-readable manifest next to it

The smoke run checks every entry in the manifest. Each module author can then see what is stable, and the system can
no longer break a reference module without noticing.

**Blocked by:** 06 — Smoke run: every sheet; 08 — Smoke run: the remaining flows; 09 — Smoke run: bonuses, statuses,
pilot and mech

**Status:** ready-for-agent

Spec: `.scratch/stabilization/spec.md`, user stories 46–50 and section "Public surface (ADR-0002)".

- [ ] `docs/public-api.md` lists everything in ADR-0002. For each entry it names the reference modules that use it and
      states the deprecation-period promise.
- [ ] The manifest lists every entry with its kind and the modules that use it. The kinds are:
  - [ ] function or method
  - [ ] hook, with the shape of its arguments
  - [ ] data path, per document type
  - [ ] setting
  - [ ] asset path
  - [ ] CSS class
- [ ] The smoke run checks every entry against its kind:
  - [ ] Functions and methods exist.
  - [ ] Hooks fire with the documented arguments during the flows the run already performs, including the hooks
        fired at startup.
  - [ ] Data paths exist on the kitted mech, pilot and NPC.
  - [ ] CSS classes appear in rendered sheets and chat cards.
  - [ ] Asset paths answer 200.
  - [ ] The setting is registered.
- [ ] Removing one entry's implementation fails the run and names the entry. This is proven once and then reverted.
- [ ] The list and the manifest cannot drift apart. The list is generated from the manifest, or a check compares the
      two.
