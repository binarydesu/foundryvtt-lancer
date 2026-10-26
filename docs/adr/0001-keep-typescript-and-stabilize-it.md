---
status: accepted
date: 2026-10-26
---

# Keep TypeScript and stabilize it in three stages

TypeScript has not protected this codebase: types are erased at build, the checker never blocks a build, and 432 errors stood on `v14` at `ef5ede4a`. The two most recent field-path bugs (`system.agility`, `flat.ranged_attack`) got through because the types were blind at those spots (`path: string`, loose `any`), not because the errors drowned in noise. We keep TypeScript anyway and make it carry weight, because it is the only tool that can list every use of a removed Foundry API after an update — including code paths a smoke test never reaches.

Stages:

1. **Gate on new errors now.** No commit may add a type error. Compare error sets with `line:col` stripped, not counts.
2. **Close the holes where bugs hid** as part of the cleanup: typed stat and field paths instead of `string`, model access without `any`, typed flow state.
3. **Reach zero** once `fvtt-types` covers the Foundry version in use: migrate, fix the rest, and let the build fail on type errors.

## Considered Options

- **Remove TypeScript (convert to plain JS).** Mechanically safe, since the shipped bundle would barely change. Rejected because it hides the 432 problems instead of fixing them, drops refactoring help, and gives up static detection of removed Foundry APIs for good.
- **Keep TypeScript as documentation only.** Cheapest, and the honest description of the status quo, but it does nothing for the main goal of surviving Foundry updates.

## Consequences

Stage 3 depends on `fvtt-types`, which lags Foundry by months. The v14 beta (`14.366.0-beta.20261009164208`, TS 5.9.3) measured 538 errors, mostly because our type predicates narrow embedded-collection elements to `never`. Until stage 3, the gate is a ratchet, not a guarantee.
