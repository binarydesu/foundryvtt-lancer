# 23 — Type holes: flows and flow state

**What to build:** The flows lose their `any` casts on model access, and flow state is typed for each flow. TypeScript
then sees what each flow step reads and writes.

**Blocked by:** 22 — Typed stat and field paths

**Status:** ready-for-agent

Spec: `.scratch/stabilization/spec.md`, user story 59 and section "Cleanup → Type holes".

- [ ] Each flow has a typed state, and its steps read and write only declared fields.
- [ ] Model access inside the flows uses no `any` cast. Field paths use the type from ticket 22.
- [ ] Flow class names, the flow helpers and the flow hooks on the public surface keep their names and their
      arguments.
- [ ] The type baseline shrinks by the errors fixed, with no new signature.
- [ ] The smoke run passes unchanged, with all flows and the hook contract checks if ticket 15 is done.
