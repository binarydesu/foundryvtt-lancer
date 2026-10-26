# 22 — Typed stat and field paths

**What to build:** Stat and field paths become a type made of the valid paths instead of a free string. The stat flow
entry point is the first user. A wrong path then fails the type check instead of silently rolling +0, which is how
the last two field-path bugs got through. This is stage 2 of ADR-0001, and it supplies the types that tickets 23–25
use.

**Blocked by:** 01 — Fast gates; 08 — Smoke run: the remaining flows

**Status:** ready-for-agent

Spec: `.scratch/stabilization/spec.md`, user story 58 and section "Cleanup → Type holes".

- [ ] One type describes the valid stat and field paths of mech, pilot, NPC and deployable data. It is derived from
      the data models where possible, not written out by hand.
- [ ] The stat flow entry point accepts only that type, and every internal caller satisfies it.
- [ ] A type-level test shows that a misspelled path fails the type check. That test runs in `npm run check`.
- [ ] At runtime, modules that pass plain strings keep working. The public surface does not change.
- [ ] All four stat checks and the skill check still pass in the smoke run.
- [ ] The type baseline shrinks or stays the same, with no new signature.
