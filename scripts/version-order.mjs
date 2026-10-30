#!/usr/bin/env node
// Proves the fork's version scheme (ADR-0003) with Foundry's own code: isNewerVersion and
// BasePackage.testDependencyCompatibility, loaded from an unzipped Foundry release.
//
//   node scripts/version-order.mjs <unzipped Foundry dir>      (the folder that holds common/ and main.mjs)
//
// Why the order matters, from Foundry 14.369's server (dist/packages/views.mjs, checkPackage):
// - The Update button first fetches the installed manifest URL, which is the fork's.
// - It then looks up the package id "lancer" in Foundry's official package listing, which is upstream's. When that
//   version is newer than the installed fork and newer than the fork's latest release, Foundry installs upstream's
//   manifest instead. So every fork version must rank above every upstream version.
// Last line: VERSION-ORDER: PASS or VERSION-ORDER: FAIL. The exit code matches.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { FORK_VERSION, nextVersion } from "./version.mjs";

const foundryDir = process.argv[2];
if (!foundryDir || !fs.existsSync(path.join(foundryDir, "common", "utils", "helpers.mjs"))) {
  console.error("usage: node scripts/version-order.mjs <unzipped Foundry dir>");
  process.exit(2);
}
const load = file => import(pathToFileURL(path.join(foundryDir, file)).href);
await load("common/primitives/_module.mjs"); // Number.isNumeric and Array#equals, which isNewerVersion uses
const { isNewerVersion } = await load("common/utils/helpers.mjs");
const { default: BasePackage } = await load("common/packages/base-package.mjs");
const { release } = JSON.parse(fs.readFileSync(path.join(foundryDir, "package.json"), "utf8"));

const base = JSON.parse(fs.readFileSync("package.json", "utf8")).version;
const current = JSON.parse(fs.readFileSync("src/system.json", "utf8")).version;
console.log(`Foundry ${release.generation}.${release.build}, upstream base ${base}, fork version ${current}`);

let failed = 0;
const newer = (v1, v0, want) => {
  const got = isNewerVersion(v1, v0);
  if (got !== want) failed++;
  console.log(`${got === want ? "ok  " : "FAIL"}  isNewerVersion("${v1}", "${v0}") = ${got}`);
};
const section = title => console.log(`\n${title}`);

if (!FORK_VERSION.test(current)) {
  failed++;
  console.log(`FAIL  src/system.json version "${current}" is not fork.<x.y.z>.<n>`);
}

section("1. Successive fork versions: each release is an update of the one before.");
const following = nextVersion(current, base);
newer(following, current, true);
newer(current, following, false);
newer(`fork.${base}.10`, `fork.${base}.9`, true);
section("   After merging a later upstream release the counter restarts, and the order still holds.");
newer(nextVersion(`fork.${base}.9`, "3.2.0"), `fork.${base}.9`, true);
newer(nextVersion("fork.3.1.9.4", "3.1.10"), "fork.3.1.9.4", true);

section(`2. Against its upstream base ${base}: switching an installation from upstream to the fork is an update.`);
newer(current, base, true);
newer(base, current, false);

section("3. Against later upstream versions: Foundry never follows upstream's package listing.");
for (const later of ["3.1.4", "3.2.0", "4.0.0", "10.0.0", "99.99.99"]) {
  newer(later, current, false);
  newer(current, later, true);
}

section("4. Reference modules' minimum Lancer versions stay satisfied (BasePackage.testDependencyCompatibility).");
for (const [module, minimum] of [
  ["csm-lancer-qol", "2"],
  ["ilysen-lancer-npc-rebake-structure", "2.8.1"],
  ["lancer-alternative-sheets, lancer-speed-provider, lancer-weapon-fx, token-action-hud-lancer", "3.0.0"],
]) {
  const ok = BasePackage.testDependencyCompatibility({ minimum }, { version: current });
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"}  minimum ${minimum}: compatible = ${ok}   (${module})`);
}

section("5. Lancer's own migration thresholds do not treat a fork world as old.");
for (const threshold of ["1.0.0", "2.0.0", "2.1.1", "2.7.0"]) newer(threshold, current, false);

section("For the record, not part of the verdict: rejected schemes lose to upstream 3.1.4.");
for (const rejected of [`${base}.fork.1`, `${base}-fork.1`, `${base}.1`]) {
  console.log(`      isNewerVersion("3.1.4", "${rejected}") = ${isNewerVersion("3.1.4", rejected)}`);
}
console.log(`      isNewerVersion("3.1.10-fork.1", "3.1.9-fork.4") = ${isNewerVersion("3.1.10-fork.1", "3.1.9-fork.4")}`);

console.log(`\nVERSION-ORDER: ${failed ? "FAIL" : "PASS"}${failed ? ` (${failed} failed)` : ""}`);
process.exitCode = failed ? 1 : 0;
