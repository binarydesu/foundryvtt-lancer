# 26 — Remove dead code

**What to build:** Code, templates, styles and assets that nothing runs are deleted. Each deletion is first checked
against the public surface. Afterwards the codebase holds only what runs, and the reference modules keep working.

**Blocked by:** 15 — Public surface: written list and contract checks

**Status:** ready-for-agent

Spec: `.scratch/stabilization/spec.md`, user stories 60–61 and section "Cleanup → Dead code".

- [ ] Candidates come from a reproducible search: unused exports, files, templates, Handlebars partials, styles and
      language keys. Every candidate is listed in this ticket's comments with its verdict.
- [ ] Before deletion, every candidate is checked against the public-surface manifest. If ticket 16 is done, it is
      also checked against the latest module scan report. Anything on the public surface stays.
- [ ] The unrendered combat-tracker config template, which still uses a removed helper, is gone.
- [ ] The type baseline shrinks or stays the same, with no new signature.
- [ ] The smoke run passes, including the contract checks.
