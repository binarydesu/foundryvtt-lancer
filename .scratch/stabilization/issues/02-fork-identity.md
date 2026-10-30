# 02 — Fork identity

**What to build:** Make ADR-0003 real. Foundry's update button on any installation of the fork, including the NAS,
must see only the fork's own releases. That needs four things:

- the system manifest points at `binarydesu/foundryvtt-lancer`
- the version number cannot be mistaken for upstream's
- a pushed version tag publishes a release on the fork
- the package id stays `lancer`

**Blocked by:** None — can start immediately.

**Status:** resolved

Spec: `.scratch/stabilization/spec.md`, user stories 37–40 and section "Fork identity (ADR-0003)".

- [x] The package id is still `lancer`.
- [x] The system manifest's `manifest` field is the fork's latest-release manifest, and its `download` field is the
      zip of that release.
- [x] `url` points at the fork repository. `bugs` points there too, because GitHub issues are disabled on the fork.
- [x] The version-bump script no longer writes an upstream download URL.
- [x] A version scheme is chosen and recorded in ADR-0003's consequences. It shows at a glance which upstream version
      the build is based on, and that it is the fork.
- [x] The ordering is proven with Foundry's own `isNewerVersion` for these cases:
  - [x] successive fork versions
  - [x] a fork version against the upstream version it is based on, so that switching the NAS from upstream 3.1.3
        counts as an update
  - [x] a fork version against a later upstream version
- [x] Pushing a version tag publishes a release on the fork. Its manifest and zip match the manifest URLs above.
- [x] The user confirms before the first tag push, because that publishes publicly.
- [x] Foundry's setup screen shows the new version for an installed build.

## Comments

**2026-10-30, implementation (worktree branch `claude/sad-nash-bdc052`, on top of `v14` at `152caeb9`):**

- `src/system.json`: version `fork.3.1.3.2` (see "Releases" below for `fork.3.1.3.1`). `url` and `bugs` point at `https://github.com/binarydesu/foundryvtt-lancer`.
  `manifest` is `.../releases/latest/download/system.json`, and `download` is
  `.../releases/download/fork.3.1.3.2/lancer-fork.3.1.3.2.zip`. The id stays `lancer`. `readme`, `changelog` and the
  `media` images still point at upstream's master. The ticket does not cover them, and Foundry does not use them for
  updates.
- **Finding: the manifest URL alone does not protect the fork.** Foundry 14.369's Update button calls `checkPackage`
  (server `dist/packages/views.mjs`, `followIndex` on by default). It reads the installed manifest URL first. Then it
  looks up the id `lancer` in Foundry's official package listing, which is upstream's. When that version is newer than
  the installed fork and newer than the fork's latest release, the button installs upstream's manifest instead. So
  the third ordering case must come out with the fork on top.
- Version scheme `fork.<upstream base>.<n>`, recorded in ADR-0003. The leading word makes every fork version newer than
  every upstream version, and the base stays readable.
- `scripts/version.mjs` (`npm run bump`) writes the next version and all five release fields. It takes the base from
  `package.json`, restarts `n` on a new base, keeps the file's formatting and refuses a file it cannot edit safely.
  `node scripts/version.mjs verify <tag> [manifest]` checks that a manifest belongs to a tag. The `npm version` hook is
  gone, because `package.json` now holds the upstream base.
- `scripts/version-order.mjs <unzipped Foundry>` imports Foundry's `isNewerVersion` and
  `BasePackage.testDependencyCompatibility`. Its last line is `VERSION-ORDER: PASS|FAIL`. Run against Foundry 14.369:
  PASS.

  | Case | Result |
  |---|---|
  | `fork.3.1.3.2` vs `fork.3.1.3.1`, `.10` vs `.9` | newer |
  | `fork.3.2.0.1` vs `fork.3.1.3.9`, `fork.3.1.10.1` vs `fork.3.1.9.4` | newer |
  | `fork.3.1.3.1` vs upstream `3.1.3` | newer, so switching counts as an update |
  | upstream `3.1.4`, `3.2.0`, `4.0.0`, `10.0.0`, `99.99.99` vs `fork.3.1.3.1` | not newer |
  | reference-module minimums `2`, `2.8.1`, `3.0.0` | satisfied (no module sets a maximum) |
  | Lancer's migration thresholds `1.0.0`, `2.0.0`, `2.1.1`, `2.7.0` | world not treated as old |

  Red check: with the version set to `3.1.3.1`, 11 cases fail.
- `.github/workflows/release.yml`:
  - It triggers on `fork.*` tags. Upstream's `v*` tags exist in the fork too, and they do not match.
  - It gets `contents: write`, because the fork's default workflow token is read-only.
  - It checks `src/system.json` and the built `dist/system.json` against the tag before it publishes.
  - The release is published and marked latest, not a draft or prerelease, because the manifest URL reads
    `releases/latest`.
  - The third-party JSON action, which was pinned to a branch, is gone.
- `src/module/world_migration.ts`: a comment says that the fork's migration thresholds must be fork versions.
- Tested in WSL (`~/lancer-02`):
  - `npm run check` passes.
  - `npm run build`, then `verify` on `dist/system.json`, passes.
  - The release zip has `system.json` at its root, with the fork's URLs.
- Tested on a disposable Foundry 14.369 in Docker, with the built `dist` mounted as the installed system:
  - The setup screen's Game Systems list shows `LANCER fork.3.1.3.1`.
  - `game.checkPackage`, the call the Update button makes, was run against three package listings:

  | Installed | Package listing | Update button |
  |---|---|---|
  | `fork.3.1.3.1` | stand-in that offers upstream 3.2.0 for Foundry 14 | stays on the fork's manifest; shows an error, because no fork release exists yet |
  | `3.1.3.fork.1` (rejected scheme) | the same stand-in | offers upstream 3.2.0 and would install from upstream's manifest |
  | `fork.3.1.3.1` | Foundry's real listing | stays on the fork's manifest |

**2026-10-30, releases:**

- The user confirmed the first tag push in this session, and later the push of `fork.3.1.3.2`. Branch
  `stab/02-fork-identity` is on the fork, and the check workflow passes there.
- `fork.3.1.3.1` (`f183bfe2`) was published without its zip.
  - Cause: Info-ZIP's `zip` reads the environment variable `ZIP` as extra options. The workflow had set `ZIP` to the
    archive name, so the archive landed in `dist/`. The upload step only warned about the missing file.
  - Reproduced with Zip 3.0 on Ubuntu 24.04, the runner's OS.
  - The user chose to leave this release as it is. Its manifest names a zip that does not exist. The manifest URL reads
    `releases/latest`, so it no longer serves this release.
- Fix (`5005c6c9`):
  - The variable is now `ARCHIVE`.
  - The packaging step compares the zip's `system.json` with the built one.
  - `artifactErrorsFailBuild: true` makes a missing artifact fail the job.
  - Red check in the same container: with `ZIP` set again, the step fails.
- `fork.3.1.3.2` (`6407d888`, bumped with `npm run bump`) is the first complete release. It is published, not a draft
  or prerelease, and it is the repository's latest release. Its assets are `system.json` and
  `lancer-fork.3.1.3.2.zip`.
  - The manifest URL `.../releases/latest/download/system.json` serves `fork.3.1.3.2`, and `verify` passes on it.
  - Its `download` URL serves the zip: 719 entries, `system.json` at the root, byte-identical to the served manifest.
- Installed from the manifest URL on a disposable Foundry 14.369 with Foundry's real package listing, through
  `game.installPackage`, the call the Install System dialog makes:

  | Before | After | Setup screen | Update button |
  |---|---|---|---|
  | nothing installed | `fork.3.1.3.2`, the fork's manifest and zip | `LANCER fork.3.1.3.2` | current |
  | like the NAS today: `3.1.3`, upstream's manifest | `fork.3.1.3.2`, the fork's manifest and zip | `LANCER fork.3.1.3.2` | current |

  So the NAS can switch to manifest-based updates by installing the manifest URL over its current build, or by the
  usual rsync deploy of a build from this branch.
