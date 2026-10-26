#!/usr/bin/env node
// `npm run check`: the fast gates. The same command runs in Debian WSL and in GitHub Actions on every push.
//
// Steps: the Node major matches .nvmrc, the type gate (type-gate.mjs), the build, and the dependency audit of the
// shipped bundle (bundle-audit.mjs). Every step runs even when an earlier one failed, except that the audit needs the
// build. The last line printed is the verdict, `CHECK: PASS` or `CHECK: FAIL`, and the exit code matches it.
// Gate on the printed line: in the Debian WSL build shell `$?` is unreliable.
//
// The build goes to node_modules/.cache/lancer-check/dist, so dist/ (the deployable build) stays as it is.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const BUILD_DIR = "node_modules/.cache/lancer-check/dist";

function checkNode(log) {
  const wanted = fs.readFileSync(path.join(ROOT, ".nvmrc"), "utf8").trim().replace(/^v/, "").split(".")[0];
  const running = process.versions.node.split(".")[0];
  log(`node ${process.versions.node}; .nvmrc asks for ${wanted}`);
  if (running !== wanted) {
    log(`The Node major differs from .nvmrc, which CI uses. Use Node ${wanted}, or change .nvmrc on purpose.`);
    return false;
  }
  return true;
}

const ci = Boolean(process.env.CI) && !["false", "0"].includes(process.env.CI);

async function typeGate(log) {
  const { runTypeGate } = await import("./type-gate.mjs");
  return runTypeGate({ root: ROOT, ci, log });
}

function build(log) {
  const vite = path.join(ROOT, "node_modules", "vite", "bin", "vite.js");
  const args = [vite, "build", "--outDir", BUILD_DIR, "--emptyOutDir", "--logLevel", "warn"];
  const run = spawnSync(process.execPath, args, { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (run.error) throw run.error;
  const output = `${run.stdout}\n${run.stderr}`.trim();
  if (run.status !== 0) {
    log(`vite build failed (exit ${run.status}). Its output:`);
    for (const line of output.split("\n").slice(-80)) log(`  ${line}`);
    return false;
  }
  const files = fs.readdirSync(path.join(ROOT, BUILD_DIR), { recursive: true }).length;
  log(`built into ${BUILD_DIR} (${files} files and folders)`);
  if (output) log(`vite printed ${output.split("\n").length} lines of warnings; \`npm run build\` shows them`);
  return true;
}

async function audit(log) {
  const { runBundleAudit } = await import("./bundle-audit.mjs");
  return runBundleAudit({ outDir: path.join(ROOT, BUILD_DIR), root: ROOT, log });
}

const results = [];

async function step(name, run) {
  const log = line => console.log(`[${name}] ${line}`);
  const started = Date.now();
  let ok = false;
  try {
    ok = (await run(log)) === true;
  } catch (error) {
    log(`crashed: ${error?.stack ?? error}`);
  }
  log(`${ok ? "PASS" : "FAIL"} (${((Date.now() - started) / 1000).toFixed(1)} s)`);
  results.push({ name, ok });
  return ok;
}

console.log(`npm run check in ${ROOT}${ci ? " (CI: the type baseline is never rewritten)" : ""}`);
await step("node", checkNode);
await step("types", typeGate);
if (await step("build", build)) {
  await step("audit", audit);
} else {
  console.log("[audit] skipped: it audits the build, and the build failed");
  results.push({ name: "audit", ok: false });
}

const passed = results.every(r => r.ok);
console.log(`summary: ${results.map(r => `${r.name} ${r.ok ? "PASS" : "FAIL"}`).join(", ")}`);
console.log(`CHECK: ${passed ? "PASS" : "FAIL"}`);
process.exitCode = passed ? 0 : 1;
