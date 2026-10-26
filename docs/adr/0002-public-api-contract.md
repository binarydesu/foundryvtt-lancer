---
status: accepted
date: 2026-10-26
---

# The public surface is what the reference modules use, and it changes only with a deprecation period

Other Lancer modules reach into this system through far more than the documented Flow API: data paths, CSS classes, asset paths, a setting, and a canvas helper. Until now nothing said which of these we must keep stable, so we broke one without noticing (see below). We fix the public surface to exactly what the eleven reference modules use plus `docs/flow_api.md`. Everything else is internal and may change freely. The surface is measured from the modules' source, not guessed, and is re-measured when the set of reference modules changes.

## The surface (measured 2026-10-26)

- **Flow API:** hooks `lancer.registerFlows`, `lancer.preFlow.<FlowName>`, `lancer.postFlow.<FlowName>`, `lancer.statusesReady`, `lancer.statusInitComplete`; `game.lancer.Flow` (subclassed), `game.lancer.flows` and `game.lancer.flowSteps` (Maps), `Flow.insertStepBefore/After`. Flow class names are part of the surface, because the hook names are built from `constructor.name`.
- **Document methods:** the twelve `begin…Flow` methods on actors and items; `is_mech`, `is_npc`, `is_deployable`, `is_recharge`, `is_loading`.
- **`game.lancer`:** `fromLid`, `fromLidSync`, `canvas.WeaponRangeTemplate.fromRange(…).placeTemplate()`, `applications.*Sheet`.
- **Data paths:** the `system.*` paths the modules read, about forty (`lid`, `hp`, `structure`, `stress`, `heat`, `overshield`, `burn`, `speed`, `size`, `tags`, `effect`, `actions`, `uses`, `loadout.weapon_mounts`, `pilot`, `core_system`, `profiles`, `origin`, `base_features`, `optional_features`, …).
- **Other:** setting `lancer.uiTheme`; asset paths under `systems/lancer/assets/icons/`; CSS classes `.lancer-button`, `.lancer-header`, `.lancer-stat-header`, `.lancer-damage-button-group`, `.lancer-combat-control`.

The maintained, exact list will live in `docs/public-api.md`; this ADR fixes the rule.

## The promise

- **Additions** are allowed at any time.
- **Breaking changes** need a deprecation period: the old name keeps working for at least one Foundry major version and logs a warning with `since` and `until`, following Foundry's own `logCompatibilityWarning` pattern.
- **Data path renames** need a migration plus a read alias for one Foundry major version.
- **Planned exceptions** get their own decision. The AppV2 follow-up program will break subclassing of `applications.*Sheet` and decides there how.

## Consequences

The Regions adoption already broke this contract. `placeTemplate()` now resolves to a `RegionDocument`, while lancer-weapon-fx's manual macros (Designate Pinaka Area, Smoke Grenade, Smoke Mine) call `update({ texture, distance, fillColor })` on the result, which are MeasuredTemplate fields that a Region silently drops. We fix this with a shim that maps those fields onto the Region, rather than declaring an exception.

Scanned module versions: csm-lancer-qol 3.0.1 (`35744d1`), ilysen-lancer-npc-rebake-structure 0.1.2.3 (`92f7f09`), lancer-alternative-sheets (`454d811`), lancer-clocks 1.0.31 (`bffcbb2`), lancer-communicator 0.7.1.1 (`1c67d58`), lancer-initiative 34 (`85d718a`), lancer-npc-creator 1.2.0 (`529a2ef`), lancer-speed-provider 7.3 (`c58fb1b`), lancer-weapon-fx 2.4.0 (`60ed944`), moss-lancer 0.2.3 (`14169ca`), token-action-hud-lancer 1.3.0 (`74f86ef`).
