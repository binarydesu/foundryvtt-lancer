# 24 — Type holes: actors, items and data models

**What to build:** Actor and item documents and the data models lose their `any` casts on model access. TypeScript
then sees what the documents read from their system data.

**Blocked by:** 22 — Typed stat and field paths

**Status:** ready-for-agent

Spec: `.scratch/stabilization/spec.md`, user story 59 and section "Cleanup → Type holes".

- [ ] Actor and item code and the data models access the models without `any` casts.
- [ ] Data preparation keeps its results. The smoke run's frame-stat, bonus and passdown checks prove this.
- [ ] Data paths on the public surface keep their names and value types.
- [ ] The type baseline shrinks by the errors fixed, with no new signature.
- [ ] The smoke run passes unchanged.
