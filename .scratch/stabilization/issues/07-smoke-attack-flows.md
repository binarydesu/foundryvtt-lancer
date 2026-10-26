# 07 — Smoke run: attack flows

**What to build:** The smoke run attacks an NPC token with a mech three ways: a weapon attack with damage, a tech attack
and a basic attack. Each attack goes through the real HUD, with deterministic dice. The run checks that the chat
cards are posted correctly and that damage lands on the target. This ticket also builds the shared tools for driving
the HUD and fixing dice results, which ticket 08 reuses.

**Blocked by:** 03 — Smoke run: harness

**Status:** ready-for-agent

Spec: `.scratch/stabilization/spec.md`, user stories 9, 10 and 15 and section "Smoke run → Core paths".

- [ ] The scene holds a mech token and an NPC token, and the NPC is targeted.
- [ ] A weapon attack runs through the HUD. Its chat card is posted with the expected style and type, and shows hit or
      miss as the fixed dice dictate.
- [ ] The damage from the attack card is applied, and the target's HP drop by the expected amount.
- [ ] A tech attack and a basic attack each run through the HUD and post their card.
- [ ] Dice are made deterministic by overriding the dice term's roll and random-face functions.
      `CONFIG.Dice.randomUniform` alone does not work. The override is restored after the step.
- [ ] Driving a HUD and fixing dice for a step are each one reusable helper.
- [ ] No step waits on fixed sleeps where an observable condition exists.
