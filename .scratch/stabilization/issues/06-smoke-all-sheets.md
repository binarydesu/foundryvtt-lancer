# 06 — Smoke run: every sheet

**What to build:** The smoke run opens every actor sheet and every item sheet the system has, filled from the official
content, and checks that each one renders. From this ticket on, errors are no longer only listed. A page error or a
console error with Lancer origin fails the run, while errors from Foundry core or modules are reported. A sheet that
refuses to open, which was one of the silent Foundry breaks in the past, is now caught.

**Blocked by:** 03 — Smoke run: harness

**Status:** ready-for-agent

Spec: `.scratch/stabilization/spec.md`, user stories 8 and 16 and section "Smoke run → Core paths".

- [ ] Every actor type renders its sheet: mech, pilot, NPC and deployable. Each actor is built from official content,
      not left empty.
- [ ] Every item type that has a sheet renders it. Each item is taken from the official compendia where the content
      has one.
- [ ] Each sheet step checks that the sheet rendered and shows the item's name. It then closes the sheet.
- [ ] An uncaught page error fails the run.
- [ ] A console error with Lancer origin fails the run. Errors from core or modules are listed with their origin.
- [ ] The test documents are built in one reusable setup step, so that later tickets can reuse the kitted mech, pilot
      and NPC.
- [ ] A screenshot of each sheet type is saved to the artifacts.
