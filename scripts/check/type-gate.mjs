#!/usr/bin/env node
// Type gate (ADR-0001, stage 1): no commit may add a type error.
//
// The gate compares the compiler's errors with a checked-in baseline of error signatures. A signature is the file,
// the error code and the message, without line and column, so code that only moves does not trip the gate.
// Identical signatures are counted, so one more copy of an error that already exists fails as well.
//
// When errors disappear, a local run shrinks the baseline, so that they cannot come back. Commit the shrunk baseline
// together with the fix. In CI, a baseline that still lists errors that no longer occur fails, which forces that.
//
// You renamed or moved a file that has errors? Change its path in the baseline in the same commit. Do not add any
// other entries by hand.
//
// Usage: node scripts/check/type-gate.mjs          run the gate
//        node scripts/check/type-gate.mjs --init   write the first baseline (only when there is none)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const BASELINE_FILE = "scripts/check/type-baseline.jsonl";

export function isCI() {
  const ci = process.env.CI;
  return Boolean(ci) && ci !== "false" && ci !== "0";
}

/** Every error that `tsc --noEmit` would report for the project's tsconfig.json. */
function compile(root) {
  const host = {
    ...ts.sys,
    onUnRecoverableConfigFileDiagnostic: d => {
      throw new Error(ts.flattenDiagnosticMessageText(d.messageText, "\n"));
    },
  };
  const config = ts.getParsedCommandLineOfConfigFile(path.join(root, "tsconfig.json"), undefined, host);
  const program = ts.createProgram({
    rootNames: config.fileNames,
    options: config.options,
    projectReferences: config.projectReferences,
    configFileParsingDiagnostics: ts.getConfigFileParsingDiagnostics(config),
  });
  return ts.getPreEmitDiagnostics(program).filter(d => d.category === ts.DiagnosticCategory.Error);
}

const toPosix = p => p.split(path.sep).join("/");

/** Turns a diagnostic into its signature plus the location, which is only used for messages. */
function describe(diagnostic, root) {
  const head = typeof diagnostic.messageText === "string" ? diagnostic.messageText : diagnostic.messageText.messageText;
  // Messages can name absolute paths (`import("/home/.../src/module/enums")`), which differ between machines.
  const message = head.split(toPosix(root) + "/").join("<repo>/");
  if (!diagnostic.file) return { file: "(no file)", code: `TS${diagnostic.code}`, message, at: "(no file)" };
  const file = toPosix(path.relative(root, diagnostic.file.fileName));
  const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start ?? 0);
  return { file, code: `TS${diagnostic.code}`, message, at: `${file}:${line + 1}:${character + 1}` };
}

const keyOf = s => JSON.stringify([s.file, s.code, s.message]);
const compareText = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const bySignature = (a, b) =>
  compareText(a.file, b.file) || compareText(a.code, b.code) || compareText(a.message, b.message);

/** Map from signature key to `{ file, code, message, count }`. */
function countSignatures(errors) {
  const counts = new Map();
  for (const { file, code, message } of errors) {
    const key = keyOf({ file, code, message });
    const entry = counts.get(key) ?? { file, code, message, count: 0 };
    entry.count += 1;
    counts.set(key, entry);
  }
  return counts;
}

const total = counts => [...counts.values()].reduce((sum, s) => sum + s.count, 0);

function readBaseline(root) {
  const file = path.join(root, BASELINE_FILE);
  if (!fs.existsSync(file)) return null;
  const counts = new Map();
  fs.readFileSync(file, "utf8")
    .split(/\r?\n/)
    .forEach((line, index) => {
      if (!line.trim()) return;
      let entry;
      try {
        entry = JSON.parse(line);
      } catch {
        throw new Error(`${BASELINE_FILE}:${index + 1} is not valid JSON`);
      }
      const { file, code, message, count } = entry;
      if (![file, code, message].every(v => typeof v === "string") || !Number.isInteger(count) || count < 1) {
        throw new Error(`${BASELINE_FILE}:${index + 1} needs a file, code, message and a count of at least 1`);
      }
      const key = keyOf(entry);
      counts.set(key, { file, code, message, count: (counts.get(key)?.count ?? 0) + count });
    });
  return counts;
}

function writeBaseline(root, counts) {
  const lines = [...counts.values()]
    .sort(bySignature)
    .map(({ file, code, count, message }) => JSON.stringify({ file, code, count, message }));
  fs.writeFileSync(path.join(root, BASELINE_FILE), lines.join("\n") + "\n");
}

/**
 * Runs the type gate and returns true when it passes. Prints what it found through `log`.
 * Locally, a passing run rewrites the baseline when errors have disappeared. In CI it never writes.
 */
export function runTypeGate({ root = ROOT, ci = isCI(), log = console.log } = {}) {
  const errors = compile(root).map(d => describe(d, root));
  const current = countSignatures(errors);
  const baseline = readBaseline(root);
  if (!baseline) {
    log(`no baseline at ${BASELINE_FILE}. Write the first one with: node scripts/check/type-gate.mjs --init`);
    return false;
  }

  const added = [];
  const gone = [];
  for (const [key, now] of current) {
    const before = baseline.get(key)?.count ?? 0;
    if (now.count > before) added.push({ ...now, before });
  }
  for (const [key, before] of baseline) {
    const now = current.get(key)?.count ?? 0;
    if (before.count > now) gone.push({ ...before, now });
  }
  added.sort(bySignature);
  gone.sort(bySignature);

  log(`tsc: ${errors.length} errors in ${current.size} signatures; baseline: ${total(baseline)} in ${baseline.size}`);

  if (added.length > 0) {
    log(`${added.length} signature(s) occur more often than the baseline allows:`);
    for (const s of added) {
      const what = s.before === 0 ? "new" : `${s.count} now, ${s.before} in the baseline`;
      log(`  + ${s.file} ${s.code} (${what}): ${s.message}`);
      for (const e of errors) if (keyOf(e) === keyOf(s)) log(`      at ${e.at}`);
    }
    if (gone.length > 0) {
      log(`${gone.length} baseline signature(s) no longer occur; the baseline shrinks once no new error is left:`);
      for (const s of gone) log(`  - ${s.file} ${s.code} (${s.count} in the baseline, ${s.now} now): ${s.message}`);
      const goneMessages = new Set(gone.map(s => s.code + s.message));
      if (added.some(s => goneMessages.has(s.code + s.message))) {
        log(`Some errors look moved to another file. If you renamed or moved a file, change its path in`);
        log(`${BASELINE_FILE} in the same commit.`);
      }
    }
    return false;
  }

  if (gone.length > 0) {
    const fixed = gone.reduce((sum, s) => sum + (s.count - s.now), 0);
    for (const s of gone) log(`  - ${s.file} ${s.code} (${s.count} in the baseline, ${s.now} now): ${s.message}`);
    if (ci) {
      log(`The baseline is stale: ${fixed} error(s) listed in it no longer occur.`);
      log(`Run \`npm run check\` locally, which shrinks ${BASELINE_FILE}, and commit it together with the fix.`);
      return false;
    }
    writeBaseline(root, current);
    log(`${fixed} error(s) fixed. The baseline shrank: commit ${BASELINE_FILE} together with the fix.`);
    return true;
  }

  log("no new type errors, and the baseline is up to date");
  return true;
}

function main(argv) {
  if (argv.includes("--init")) {
    if (fs.existsSync(path.join(ROOT, BASELINE_FILE))) {
      console.log(`${BASELINE_FILE} already exists. The gate shrinks it on its own; it never grows.`);
      return false;
    }
    const counts = countSignatures(compile(ROOT).map(d => describe(d, ROOT)));
    writeBaseline(ROOT, counts);
    console.log(`wrote ${BASELINE_FILE}: ${total(counts)} errors in ${counts.size} signatures`);
    return true;
  }
  return runTypeGate();
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let ok = false;
  try {
    ok = main(process.argv.slice(2));
  } catch (error) {
    console.log(`type gate crashed: ${error?.stack ?? error}`);
  }
  console.log(`TYPES: ${ok ? "PASS" : "FAIL"}`);
  process.exitCode = ok ? 0 : 1;
}
