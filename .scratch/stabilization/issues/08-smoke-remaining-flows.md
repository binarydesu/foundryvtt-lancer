# 08 — Smoke run: the remaining flows

**What to build:** Every other flow that a GM or player starts from the sheets runs to completion in the smoke run.
The run checks each flow's chat card and the change it makes on the actor. A flow that stops halfway is caught.

**Blocked by:** 07 — Smoke run: attack flows

**Status:** ready-for-agent

Spec: `.scratch/stabilization/spec.md`, user stories 9 and 10 and section "Smoke run → Core paths".

- [ ] All four stat checks (HULL, AGI, SYS, ENG) and a pilot skill check post their card.
- [ ] Structure and overheat apply their damage. With fixed dice they post the table result that the dice dictate.
- [ ] Stabilize restores what the chosen option restores.
- [ ] Full repair restores HP, heat, structure, stress and limited uses.
- [ ] Overcharge raises heat by the current overcharge step and advances the step.
- [ ] Core active spends core power.
- [ ] NPC recharge marks a recharge feature charged when the fixed die meets its threshold.
- [ ] A system, a talent and a bond activation each post their card.
- [ ] Burn deals damage and clears or keeps burn according to the fixed check.
- [ ] Every flow uses the HUD and dice helpers from ticket 07.
- [ ] Every flow posts its chat card with the expected style and type.
