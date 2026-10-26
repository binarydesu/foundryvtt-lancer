#!/usr/bin/env node
// Dependency audit of the shipped bundle.
//
// Only packages whose code ends up in the built system are audited, whether package.json lists them under
// dependencies or devDependencies (svelte and nanoid are devDependencies, but they ship). The source maps of a fresh
// build tell which installed packages those are. They go into a throwaway lockfile that lists nothing else, and
// `npm audit` runs on that lockfile, so the advisory data and version matching are npm's own.
//
// High and critical findings fail. Lower findings are reported and do not fail.
//
// Usage: node scripts/check/bundle-audit.mjs <build output directory>

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const WORK_DIR = "node_modules/.cache/lancer-check/audit";
const FAILING = new Set(["high", "critical"]);
const SEVERITY_ORDER = ["critical", "high", "moderate", "low", "info"];

function listMaps(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter(entry => entry.isFile() && entry.name.endsWith(".map"))
    .map(entry => path.join(entry.parentPath, entry.name));
}

/** Installed packages that contribute code to the build in `outDir`, sorted by install path (`node_modules/x`). */
export function bundledPackages(outDir, root = ROOT) {
  const maps = listMaps(outDir);
  if (maps.length === 0) throw new Error(`no source maps in ${outDir}; the build must write them`);
  const packages = new Map();
  for (const mapFile of maps) {
    const map = JSON.parse(fs.readFileSync(mapFile, "utf8"));
    for (const source of map.sources ?? []) {
      const absolute = path
        .resolve(path.dirname(mapFile), map.sourceRoot ?? "", source)
        .split(path.sep)
        .join("/");
      const at = absolute.lastIndexOf("/node_modules/");
      if (at < 0) continue;
      const [first, second] = absolute.slice(at + "/node_modules/".length).split("/");
      if (!first || first.startsWith(".")) continue; // tool caches such as node_modules/.vite
      const name = first.startsWith("@") ? `${first}/${second}` : first;
      const installDir = absolute.slice(0, at) + "/node_modules/" + name;
      if (packages.has(installDir)) continue;
      const manifest = JSON.parse(fs.readFileSync(path.join(installDir, "package.json"), "utf8"));
      const relative = path.relative(root, installDir).split(path.sep).join("/");
      const lockPath = relative.startsWith("node_modules/") ? relative : `node_modules/${name}`;
      packages.set(installDir, { name, version: manifest.version, lockPath });
    }
  }
  return [...packages.values()].sort((a, b) => (a.lockPath < b.lockPath ? -1 : a.lockPath > b.lockPath ? 1 : 0));
}

function npmCommand() {
  // Under `npm run`, npm_execpath points at the npm that started us; use the same one.
  const npmCli = process.env.npm_execpath;
  if (npmCli && /npm-cli\.js$/.test(npmCli)) return [process.execPath, [npmCli]];
  return ["npm", []];
}

/** Runs `npm audit` on a lockfile that lists exactly `packages`. Returns the findings, worst first. */
export function auditPackages(packages, root = ROOT) {
  const dir = path.join(root, WORK_DIR);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });

  const dependencies = {};
  const lockPackages = { "": { name: "lancer-bundle-audit", version: "0.0.0", dependencies } };
  for (const { name, version, lockPath } of packages) {
    lockPackages[lockPath] = { version };
    if (lockPath === `node_modules/${name}`) dependencies[name] = version;
  }
  const manifest = { name: "lancer-bundle-audit", version: "0.0.0", private: true, dependencies };
  const lock = {
    name: manifest.name,
    version: manifest.version,
    lockfileVersion: 3,
    requires: true,
    packages: lockPackages,
  };
  fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify(manifest, null, 2) + "\n");
  fs.writeFileSync(path.join(dir, "package-lock.json"), JSON.stringify(lock, null, 2) + "\n");

  const [command, prefix] = npmCommand();
  const run = spawnSync(command, [...prefix, "audit", "--json", "--package-lock-only"], {
    cwd: dir,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (run.error) throw run.error;
  let report;
  try {
    report = JSON.parse(run.stdout);
  } catch {
    throw new Error(`npm audit printed no JSON report:\n${run.stdout}\n${run.stderr}`.trim());
  }
  if (report.error) throw new Error(`npm audit failed: ${report.error.summary ?? JSON.stringify(report.error)}`);

  const versions = new Map(packages.map(p => [p.lockPath, p.version]));
  const findings = [];
  for (const vulnerability of Object.values(report.vulnerabilities ?? {})) {
    const where = (vulnerability.nodes ?? []).map(node => `${vulnerability.name}@${versions.get(node) ?? "?"}`);
    for (const advisory of vulnerability.via ?? []) {
      if (typeof advisory !== "object") continue; // only names another vulnerable package, which is listed itself
      findings.push({
        severity: advisory.severity,
        where: [...new Set(where)].join(", ") || vulnerability.name,
        title: advisory.title,
        url: advisory.url,
        range: advisory.range,
      });
    }
  }
  const rank = severity => {
    const index = SEVERITY_ORDER.indexOf(severity);
    return index < 0 ? SEVERITY_ORDER.length : index;
  };
  return findings.sort((a, b) => rank(a.severity) - rank(b.severity) || (a.where < b.where ? -1 : 1));
}

/** Runs the audit for the build in `outDir` and returns true when it passes. */
export function runBundleAudit({ outDir, root = ROOT, log = console.log }) {
  const packages = bundledPackages(outDir, root);
  log(`${packages.length} packages ship in the bundle: ${packages.map(p => `${p.name}@${p.version}`).join(", ")}`);
  const findings = auditPackages(packages, root);
  for (const f of findings) {
    log(`  ${String(f.severity).padEnd(8)} ${f.where} (affected ${f.range}): ${f.title} ${f.url}`);
  }
  const failing = findings.filter(f => FAILING.has(f.severity));
  if (failing.length > 0) {
    log(`${failing.length} high or critical finding(s) in the shipped bundle`);
    return false;
  }
  log(
    findings.length === 0
      ? "no known vulnerabilities in the shipped bundle"
      : `no high or critical findings; ${findings.length} lower finding(s) reported above`
  );
  return true;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let ok = false;
  try {
    const outDir = process.argv[2];
    if (!outDir) throw new Error("usage: node scripts/check/bundle-audit.mjs <build output directory>");
    ok = runBundleAudit({ outDir: path.resolve(outDir) });
  } catch (error) {
    console.log(`audit crashed: ${error?.stack ?? error}`);
  }
  console.log(`AUDIT: ${ok ? "PASS" : "FAIL"}`);
  process.exitCode = ok ? 0 : 1;
}
