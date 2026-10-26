# 25 — Type holes: effects, helpers, utilities and applications

**What to build:** The remaining areas lose their `any` casts on model access: active effects, the helpers, the
utilities and the applications. With tickets 23 and 24, stage 2 of ADR-0001 is then complete.

**Blocked by:** 22 — Typed stat and field paths

**Status:** ready-for-agent

Spec: `.scratch/stabilization/spec.md`, user story 59 and section "Cleanup → Type holes".

- [ ] These areas access models without `any` casts.
- [ ] The HTML builders keep their output. The smoke run's sheet screenshots and checks prove this.
- [ ] The type baseline shrinks by the errors fixed, with no new signature.
- [ ] The smoke run passes unchanged.
- [ ] If tickets 23 and 24 are also done, ADR-0001 records that stage 2 is complete, together with the remaining
      baseline size.
