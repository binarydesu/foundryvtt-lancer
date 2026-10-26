---
status: accepted
date: 2026-10-26
---

# The fork keeps the package id `lancer` but has its own manifest, version and releases

Until now `system.json` pointed `url`, `manifest`, `download` and `bugs` at Eranziel's upstream repository and carried upstream's version number (3.1.3). That was harmless only because upstream's latest release is also 3.1.3 and verified for Foundry 13 alone. As soon as upstream publishes a release that is compatible with the running Foundry version, Foundry's "Update" button would replace this fork with upstream and silently drop every fix the fork carries. We therefore point the manifest, download, url and bugs fields at `binarydesu/foundryvtt-lancer`, use a version number that is clearly distinguishable from upstream's, and publish releases from the fork's own `release.yml`.

The package id stays `lancer`. The reference modules check `game.system.id === "lancer"` and look up `systems/lancer/...` asset paths, so a different id would break exactly the compatibility this fork exists to protect. The same id rules out a listing in Foundry's package directory, so the fork is installable by manifest URL but not advertised and carries no support promise.

## Consequences

- Foundry's update check on any installation of the fork, including the NAS, sees only the fork's releases.
- The version scheme must still order correctly under `foundry.utils.isNewerVersion`; it is settled in the spec, not here.
- The NAS can install and update through the manifest URL instead of rsync; the rsync deploy stays available.
