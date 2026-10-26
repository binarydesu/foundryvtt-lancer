# 01 — Fast gates

**What to build:** One command, `npm run check`, gives the same verdict locally in WSL and in GitHub Actions on every
push to any branch of the fork. In this ticket it runs three things: the type gate (ADR-0001, stage 1), a dependency
audit of what ends up in the shipped bundle, and the build. Ticket 12 later adds the unit tests and the Foundry-free
import check to the same command. The pre-commit setup (husky and lint-staged) never ran anywhere, so it is removed.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

Spec: `.scratch/stabilization/spec.md`, user stories 29–34 and section "Fast gates".

- [ ] `npm run check` runs in Debian WSL and ends with one printed verdict line, `CHECK: PASS` or `CHECK: FAIL`. The
      exit code matches the verdict. Callers gate on the printed line, because `$?` is unreliable in that shell.
- [ ] The type gate compares the compiler's errors with a checked-in baseline of error signatures. A signature is the
      file, the error code and the message, without line and column. Identical signatures are counted, so one more
      copy of an existing error also fails.
- [ ] A new type error fails the gate and the output names the new signature. Code that only moves, so that line
      numbers shift, does not fail the gate.
- [ ] When the local check runs after an error has been fixed, the baseline shrinks. In CI, a baseline that still
      lists signatures that no longer occur fails. This forces the shrink to be committed together with the fix.
- [ ] The first baseline holds exactly today's errors, and the gate is green on today's code.
- [ ] The dependency audit covers only the dependencies that end up in the shipped bundle. It fails on high and
      critical findings and reports the others.
- [ ] A GitHub Actions workflow runs `npm run check` on every push to any branch of `binarydesu/foundryvtt-lancer`. It
      uses the same Node major as the WSL toolchain. The release workflow stays as it is, because ticket 02 owns it.
- [ ] husky, lint-staged, their configuration, the hook folder and the `prepare` script are gone. `npm ci` still
      succeeds in WSL and in CI.
- [ ] Proof that the gate works: a throwaway branch with one new type error shows red in Actions. Delete that branch
      afterwards.
