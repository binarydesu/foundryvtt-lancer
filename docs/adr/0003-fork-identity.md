---
status: accepted
date: 2026-10-26
---

# The fork keeps the package id `lancer` but has its own manifest, version and releases

Until now `system.json` pointed `url`, `manifest`, `download` and `bugs` at Eranziel's upstream repository and carried upstream's version number (3.1.3). That was harmless only because upstream's latest release is also 3.1.3 and verified for Foundry 13 alone. As soon as upstream publishes a release that is compatible with the running Foundry version, Foundry's "Update" button would replace this fork with upstream and silently drop every fix the fork carries. We therefore point the manifest, download, url and bugs fields at `binarydesu/foundryvtt-lancer`, use a version number that is clearly distinguishable from upstream's, and publish releases from the fork's own `release.yml`.

The package id stays `lancer`. The reference modules check `game.system.id === "lancer"` and look up `systems/lancer/...` asset paths, so a different id would break exactly the compatibility this fork exists to protect. The same id rules out a listing in Foundry's package directory, so the fork is installable by manifest URL but not advertised and carries no support promise.

## Consequences

- Foundry's update check on any installation of the fork, including the NAS, sees only the fork's releases. The manifest URL alone does not ensure this. Foundry 14's Update button (`checkPackage` in the server's `dist/packages/views.mjs`) first reads the installed manifest URL. Then it looks up the package id in Foundry's official package listing, and the listing for `lancer` is upstream's. When the listed version is newer than the installed version and newer than the fork's latest release, the button installs the listed manifest. Only the version number can stop this, so every fork version must be newer than every upstream version.
- **Version scheme: `fork.<upstream base>.<n>`**, for example `fork.3.1.3.1`.
  - The upstream base is the upstream release the build is based on. It is the version in `package.json` and changes only when upstream releases are merged in.
  - `n` counts the fork's releases on that base. It starts again at 1 on a new base.
  - `isNewerVersion` compares the leading `fork` with upstream's leading number as text, and letters sort after digits. So every fork version is newer than every upstream version. All other parts compare as numbers, so `fork.3.1.10.1` is newer than `fork.3.1.9.4`.
  - `npm run bump` writes the next version and the release URLs into `src/system.json`. `node scripts/version-order.mjs <unzipped Foundry>` proves the order with Foundry's own `isNewerVersion`.
  - Rejected: `3.1.3-fork.1`, `3.1.3.fork.1` and `3.1.3.1`. They show the base, but upstream 3.1.4 would replace the fork through the listing. `3.1.3.1` also does not look like the fork, and the `-fork` form ranks 3.1.10 below 3.1.9.
  - Checked on Foundry 14.369, with a stand-in listing that offers upstream 3.2.0 for Foundry 14: the Update button kept `fork.3.1.3.1` on the fork's manifest, and offered upstream 3.2.0 for an installed `3.1.3.fork.1`.
- The release tag is the version itself. A pushed `fork.*` tag publishes the release through `.github/workflows/release.yml`, as the latest release, which the manifest URL points at. Upstream's `v*` tags, which the fork repository also holds, do not trigger it.
- Wherever versions are compared, a fork version counts as newer than any upstream version. A migration the fork adds must use a fork version as its threshold; an upstream-style threshold such as `3.2.0` never runs. Going back to upstream later is a manual reinstall, and Lancer's own world migrations would not run for it, because the stored fork version counts as newer.
- The NAS can install and update through the manifest URL instead of rsync; the rsync deploy stays available.
