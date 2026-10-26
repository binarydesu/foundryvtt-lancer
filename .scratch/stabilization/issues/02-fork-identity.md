# 02 — Fork identity

**What to build:** Make ADR-0003 real. Foundry's update button on any installation of the fork, including the NAS,
must see only the fork's own releases. That needs four things:

- the system manifest points at `binarydesu/foundryvtt-lancer`
- the version number cannot be mistaken for upstream's
- a pushed version tag publishes a release on the fork
- the package id stays `lancer`

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

Spec: `.scratch/stabilization/spec.md`, user stories 37–40 and section "Fork identity (ADR-0003)".

- [ ] The package id is still `lancer`.
- [ ] The system manifest's `manifest` field is the fork's latest-release manifest, and its `download` field is the
      zip of that release.
- [ ] `url` points at the fork repository. `bugs` points there too, because GitHub issues are disabled on the fork.
- [ ] The version-bump script no longer writes an upstream download URL.
- [ ] A version scheme is chosen and recorded in ADR-0003's consequences. It shows at a glance which upstream version
      the build is based on, and that it is the fork.
- [ ] The ordering is proven with Foundry's own `isNewerVersion` for these cases:
  - [ ] successive fork versions
  - [ ] a fork version against the upstream version it is based on, so that switching the NAS from upstream 3.1.3
        counts as an update
  - [ ] a fork version against a later upstream version
- [ ] Pushing a version tag publishes a release on the fork. Its manifest and zip match the manifest URLs above.
- [ ] The user confirms before the first tag push, because that publishes publicly.
- [ ] Foundry's setup screen shows the new version for an installed build.
