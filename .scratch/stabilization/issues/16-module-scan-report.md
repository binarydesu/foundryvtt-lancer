# 16 — Reference-module scan report

**What to build:** A script fetches the latest release of each of the eleven reference modules and extracts every use
of the system from their scripts and their compendium-pack macros. It reports each use that the public-surface
manifest does not contain. The report runs with every smoke run that follows a Foundry update and never fails the run.
The contract can then follow the modules as they change.

**Blocked by:** 15 — Public surface: written list and contract checks

**Status:** ready-for-agent

Spec: `.scratch/stabilization/spec.md`, user story 51 and section "Public surface (ADR-0002) → Module scan report".

- [ ] The script reads each module's release through its manifest URL. The list of modules is the one recorded in
      ADR-0002.
- [ ] Scripts and macros stored in compendium packs are both scanned. The first scan missed lancer-weapon-fx's macros,
      which live in packs.
- [ ] Per module, the report prints the version scanned, how many files and macros it read, and how many hits a
      control term found. An empty result can then never be mistaken for a scan that did not run.
- [ ] The report lists every use that the manifest lacks, with the module and the place it was found.
- [ ] The report never changes the smoke run's verdict.
- [ ] Downloads go to the per-machine cache, each in its own fresh directory, and are only read, never executed.
