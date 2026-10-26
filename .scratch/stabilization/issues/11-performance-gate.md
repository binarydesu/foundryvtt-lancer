# 11 — Performance baseline and gate

**What to build:** The smoke run measures how fast the system runs on a scene with about fifteen tokens and compares
each run with the last baseline on the same machine. A large slowdown or a single long freeze fails the run. The game
then stays smooth after every change and every Foundry update.

**Blocked by:** 06 — Smoke run: every sheet; 08 — Smoke run: the remaining flows

**Status:** ready-for-agent

Spec: `.scratch/stabilization/spec.md`, user stories 25–28 and section "Performance".

- [ ] A scene with about fifteen tokens of kitted mechs, pilots and NPCs is built from official content.
- [ ] The run measures the following:
  - [ ] data preparation per actor
  - [ ] render time per sheet type
  - [ ] flow duration, without the time spent waiting on the HUD
  - [ ] actor-update round trip, including hooks
  - [ ] long tasks, meaning the main thread is blocked for more than 50 ms, through a long-task observer
- [ ] The baseline lives in the per-machine cache, not in the repository. The first run writes it.
- [ ] A run fails when a measured value is more than 50 % worse than the baseline, or when any single task during a
      flow or sheet render takes longer than 200 ms.
- [ ] Both thresholds are checked against the first measurement and adjusted there, with the reason written down.
- [ ] The comparison works across Foundry versions, so a run on a new Foundry version shows whether that version made
      Lancer slower.
- [ ] The report prints every measured value next to its baseline.
- [ ] FPS is not measured, because headless Chromium has no GPU.
