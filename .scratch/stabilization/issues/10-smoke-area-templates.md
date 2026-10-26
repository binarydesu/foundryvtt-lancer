# 10 — Smoke run: area templates

**What to build:** On a scene that gets a grid for this step, the smoke run places a Blast, a Line, a Cone and a Burst
with the real mouse. Each one must target exactly the tokens it covers. Area attacks that never targeted anyone were
one of the silent Foundry breaks.

**Blocked by:** 03 — Smoke run: harness

**Status:** ready-for-agent

Spec: `.scratch/stabilization/spec.md`, user story 14 and section "Smoke run → Core paths".

- [ ] The step gives a scene a square grid and puts tokens at known cells, some inside each area and some just
      outside it.
- [ ] Blast, Line, Cone and Burst are each placed through the system's template placement with real mouse moves and
      clicks.
- [ ] After each placement, exactly the tokens inside the area are targeted.
- [ ] The scene's grid is removed again after the step.
- [ ] The step reports which area type failed and which tokens were expected and which were targeted.
