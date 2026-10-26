# 01 — Fast gates

**What to build:** One command, `npm run check`, gives the same verdict locally in WSL and in GitHub Actions on every
push to any branch of the fork. In this ticket it runs three things: the type gate (ADR-0001, stage 1), a dependency
audit of what ends up in the shipped bundle, and the build. Ticket 12 later adds the unit tests and the Foundry-free
import check to the same command. The pre-commit setup (husky and lint-staged) never ran anywhere, so it is removed.

**Blocked by:** None — can start immediately.

**Status:** resolved

Spec: `.scratch/stabilization/spec.md`, user stories 29–34 and section "Fast gates".

- [x] `npm run check` runs in Debian WSL and ends with one printed verdict line, `CHECK: PASS` or `CHECK: FAIL`. The
      exit code matches the verdict. Callers gate on the printed line, because `$?` is unreliable in that shell.
- [x] The type gate compares the compiler's errors with a checked-in baseline of error signatures. A signature is the
      file, the error code and the message, without line and column. Identical signatures are counted, so one more
      copy of an existing error also fails.
- [x] A new type error fails the gate and the output names the new signature. Code that only moves, so that line
      numbers shift, does not fail the gate.
- [x] When the local check runs after an error has been fixed, the baseline shrinks. In CI, a baseline that still
      lists signatures that no longer occur fails. This forces the shrink to be committed together with the fix.
- [x] The first baseline holds exactly today's errors, and the gate is green on today's code.
- [x] The dependency audit covers only the dependencies that end up in the shipped bundle. It fails on high and
      critical findings and reports the others.
- [x] A GitHub Actions workflow runs `npm run check` on every push to any branch of `binarydesu/foundryvtt-lancer`. It
      uses the same Node major as the WSL toolchain. The release workflow stays as it is, because ticket 02 owns it.
- [x] husky, lint-staged, their configuration, the hook folder and the `prepare` script are gone. `npm ci` still
      succeeds in WSL and in CI.
- [x] Proof that the gate works: a throwaway branch with one new type error shows red in Actions. Delete that branch
      afterwards.

## Comments

**2026-10-26, implementation (branch `stab/01-fast-gates`):**

- `npm run check` runs `scripts/check/check.mjs`. Its steps are the Node major against `.nvmrc`, the type gate
  (`type-gate.mjs`), `vite build` into `node_modules/.cache/lancer-check/dist`, and the bundle audit
  (`bundle-audit.mjs`). The build does not touch `dist/`. All steps run even when one fails; the audit needs the build.
  Ticket 12 adds its steps to `check.mjs`.
- Type gate: it uses the compiler API and finds the same 432 errors as `tsc --noEmit`. The message part of a
  signature is the first line of a chained message. The repo root inside messages becomes `<repo>/`, because tsc prints
  absolute paths. The baseline `scripts/check/type-baseline.jsonl` holds 432 errors in 268 signatures. It is identical
  to the error set measured at `ef5ede4a`.
  - A local run shrinks the baseline only when no new error exists.
  - When the `CI` variable is set, the gate never writes the baseline, and a stale baseline fails.
  - After you rename a file, change its path in the baseline.
- Tested in WSL:

  | Change | Gate result |
  |---|---|
  | Shifted lines in three files | PASS, baseline unchanged |
  | A new error | FAIL, names the signature and its location |
  | A second copy of an existing error | FAIL, "2 now, 1 in the baseline" |
  | A fixed error, local run | PASS, baseline loses one line |
  | The same fix with `CI=true` | FAIL, stale baseline |
  | A renamed file | FAIL with a hint; PASS after the path change |
- Audit: the build's source maps show which packages ship. There are 15. `svelte`, `nanoid`, `clsx` and
  `@popperjs/core` ship although they are devDependencies or transitive, so `npm audit --omit=dev` would be wrong.
  `npm audit` runs on a temporary lockfile that lists only these 15 packages.
  - With the old `nanoid` 3.3.12 the audit failed on two high findings (GHSA-28wg-ghj8-5hjv, GHSA-2v37-7h3g-55p8).
    `nanoid` is now 3.3.20, still major 3.
  - Lower findings are reported and do not fail. A test with `svelte` 5.55.6 and `jszip` 3.7.0 showed them as
    moderate.
  - The full-tree audit shows 21 findings, all in dev tooling that does not ship.
- Workflow `.github/workflows/check.yml`: it runs on push to any branch of the fork, with
  `actions/checkout@v7`, `actions/setup-node@v7`, `node-version-file: .nvmrc` (22) and `npm ci`. `release.yml` is
  unchanged.
- husky and lint-staged were removed with `npm uninstall`, which pruned 59 packages. A fresh WSL clone ran `npm ci`
  with no hook path set, and `npm run check` printed `CHECK: PASS`.
- Actions, green: https://github.com/binarydesu/foundryvtt-lancer/actions/runs/40397837802 (Node 22.23.3, the same
  432 errors in 268 signatures).
- Actions, red: https://github.com/binarydesu/foundryvtt-lancer/actions/runs/40397881277. The branch
  `throwaway/type-gate-red` had `export const typeGateProbe: string = 1;`, and the gate printed
  `+ src/module/canvas/drop-status.ts TS2322 (new)` and failed. The branch was deleted on the fork and locally.
