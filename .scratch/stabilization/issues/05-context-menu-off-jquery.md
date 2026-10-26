# 05 — Mech sheet context menu without jQuery

**What to build:** The mech sheet's mount context menu passes an HTML element to Foundry's context menu instead of a
jQuery object. Foundry removes the jQuery form in version 15. The deprecation gate from ticket 04 drives this ticket
test-first: it goes from red to green.

**Blocked by:** 04 — Deprecation gate

**Status:** ready-for-agent

Spec: `.scratch/stabilization/spec.md`, user story 53 and section "Known breaks and fresh-world bugs".

- [ ] The smoke run opens the mech sheet's mount context menu, picks an entry and checks the result on the mech. This
      step passes before and after the change.
- [ ] After the change the deprecation gate is green on 14.369, and no Lancer context-menu warning remains in the
      report.
- [ ] Any other place where Lancer hands jQuery to a Foundry context menu is fixed the same way, if the gate reports
      one.
- [ ] The type gate shows no new signature.
