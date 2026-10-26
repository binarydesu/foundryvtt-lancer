# 04 — Deprecation gate

**What to build:** The smoke run reads every deprecation warning Foundry prints during the run. For each one it records
the version it was deprecated in (since), the version it will be removed in (until) and its origin: Lancer, Foundry core
or a module. For Lancer warnings it also records the TypeScript source location. The run fails when a Lancer warning
will be removed in the next Foundry major, and reports everything else. A Foundry break can then no longer arrive
unannounced. The gate starts red on today's code because of the mech sheet's context menu; ticket 05 makes it green.

**Blocked by:** 03 — Smoke run: harness

**Status:** ready-for-agent

Spec: `.scratch/stabilization/spec.md`, user stories 21–24 and section "Deprecation gate".

- [ ] Every Foundry deprecation warning of the run appears in the report with since, until, origin and how often it
      occurred.
- [ ] A warning counts as Lancer's when its stack runs through the system's files.
- [ ] A Lancer warning's location is mapped back to TypeScript source (file and line) through the shipped source maps.
- [ ] The run fails on a Lancer warning whose until is at most the current Foundry major plus one. Later removals and
      non-Lancer warnings are reported without failing.
- [ ] No list is maintained by hand. Each run's report is the list.
- [ ] On 14.369 the gate is red, and the report names the mech sheet's context menu with its TypeScript location.
      This red state is expected until ticket 05 lands.
- [ ] The roll-mode fallback (until 16) and the ApplicationV1 warnings (until 16) are reported but do not fail the run.
- [ ] Warnings that Lancer itself issues to modules, such as a shim's warning (ticket 17), are listed in their own
      section of the report. They never count as a Foundry break.

## Prototype

From the throwaway driver on `prototype/smoke-driver`. It shows how the prototype parsed Foundry's warning text; the
origin check by URL fragment was not enough for TypeScript locations:

```js
const since = text.match(/Deprecated since Version (\d+)/);
const until = text.match(/removed in Version (\d+)/);
const origin = /\/systems\/lancer\//.test(text) ? "lancer" : /\/modules\//.test(text) ? "module" : "core/other";
```
