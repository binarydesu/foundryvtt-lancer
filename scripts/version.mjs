#!/usr/bin/env node
// The fork's version number and release URLs (ADR-0003).
//
// Version scheme: fork.<upstream base>.<n>, for example fork.3.1.3.1.
// - <upstream base> is the version in package.json. It changes only when upstream releases are merged in, so do not
//   run `npm version`.
// - <n> counts the fork's releases on that base. It starts again at 1 when the base changes.
// - Foundry's isNewerVersion compares "fork" with upstream's leading number as text, and letters sort after digits.
//   So every fork version is newer than every upstream version, and Foundry's update check never offers upstream's
//   package listing in place of the fork. scripts/version-order.mjs proves the ordering.
// The release tag is the version itself. A pushed tag fork.* runs .github/workflows/release.yml.
//
//   node scripts/version.mjs bump                      write the next version and the fork URLs into src/system.json
//   node scripts/version.mjs verify <tag> [manifest]   fail unless the manifest (default src/system.json) is the one
//                                                      the release for <tag> must ship
import fs from "node:fs";
import { pathToFileURL } from "node:url";

const REPO = "https://github.com/binarydesu/foundryvtt-lancer";
const SOURCE = "src/system.json";
const PACKAGE_ID = "lancer";
export const FORK_VERSION = /^fork\.(\d+\.\d+\.\d+)\.(\d+)$/;

/** The fields that tie a manifest to the fork's release of `version`. */
export function releaseFields(version) {
  return {
    id: PACKAGE_ID,
    version,
    url: REPO,
    // GitHub issues are disabled on the fork, so bugs points at the repository.
    bugs: REPO,
    manifest: `${REPO}/releases/latest/download/system.json`,
    download: `${REPO}/releases/download/${version}/${PACKAGE_ID}-${version}.zip`,
  };
}

/** The version after `current` on the upstream base `base`. */
export function nextVersion(current, base) {
  const match = FORK_VERSION.exec(current);
  const n = match && match[1] === base ? Number(match[2]) + 1 : 1;
  return `fork.${base}.${n}`;
}

/** Every way `manifest` differs from what the release for `tag` must ship. */
export function problems(manifest, tag) {
  const found = [];
  if (!FORK_VERSION.test(manifest.version ?? "")) found.push(`version "${manifest.version}" is not fork.<x.y.z>.<n>`);
  if (tag !== undefined && tag !== manifest.version) found.push(`tag "${tag}" differs from version "${manifest.version}"`);
  for (const [key, want] of Object.entries(releaseFields(manifest.version))) {
    if (manifest[key] !== want) found.push(`${key} is "${manifest[key]}", expected "${want}"`);
  }
  return found;
}

// Replace a top-level string field in place, so the file keeps its formatting. Top-level keys sit at two spaces.
function setField(text, key, value) {
  const pattern = new RegExp(`^(  "${key}":\\s*)"[^"]*"`, "m");
  if (!pattern.test(text)) throw new Error(`${SOURCE} has no top-level "${key}" string field`);
  return text.replace(pattern, (_, prefix) => prefix + JSON.stringify(value));
}

function bump() {
  const base = JSON.parse(fs.readFileSync("package.json", "utf8")).version;
  let text = fs.readFileSync(SOURCE, "utf8");
  const version = nextVersion(JSON.parse(text).version, base);
  const { id: _id, ...fields } = releaseFields(version);
  for (const [key, value] of Object.entries(fields)) text = setField(text, key, value);
  const found = problems(JSON.parse(text));
  if (found.length) throw new Error(`${SOURCE} after the bump:\n  ${found.join("\n  ")}`);
  fs.writeFileSync(SOURCE, text);
  console.log(version);
}

function verify(tag, file = SOURCE) {
  if (!tag) throw new Error("usage: node scripts/version.mjs verify <tag> [manifest]");
  const found = problems(JSON.parse(fs.readFileSync(file, "utf8")), tag);
  for (const line of found) console.log(`  ${line}`);
  console.log(`RELEASE-MANIFEST: ${found.length ? "FAIL" : "PASS"} (${file}, tag ${tag})`);
  if (found.length) process.exitCode = 1;
}

// Run as a command, not when scripts/version-order.mjs imports the scheme.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [command, ...args] = process.argv.slice(2);
  if (command === "bump") bump();
  else if (command === "verify") verify(...args);
  else {
    console.error("usage: node scripts/version.mjs bump | verify <tag> [manifest]");
    process.exitCode = 2;
  }
}
