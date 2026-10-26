# Lancer system for Foundry VTT (binarydesu fork)

A personal fork of the Lancer game system for Foundry Virtual Tabletop. Its main goal is to keep working across Foundry updates while staying compatible with the Lancer modules most tables use.

## Language

### Compatibility

**Reference module**:
A third-party Foundry module built for Lancer whose use of this system defines what the system must keep stable. The set is fixed by a recorded decision, not by whatever happens to be installed somewhere.
_Avoid_: installed module, popular module, known module

**Public surface**:
Everything of this system that the reference modules use: functions, hooks, data paths, a setting, asset paths and CSS classes. It changes only with a deprecation period; everything outside it is internal.
_Avoid_: API (too narrow, misses data paths and CSS), exports

**Deprecation period**:
The time, at least one Foundry major version, during which a replaced part of the public surface keeps working and warns with the version it will be removed in.
_Avoid_: grace period, transition phase

**Compatibility layer**:
The one place in the system through which it calls the Foundry APIs that have broken in past Foundry updates, so that the next such break is repaired there and nowhere else.
_Avoid_: adapter, wrapper, compat module

**Shim**:
Code that keeps an old form of the public surface working after the system changed underneath it, for a deprecation period or for good. It faces the modules; the compatibility layer faces Foundry.
_Avoid_: polyfill, backport

**Foundry break**:
A Foundry update that removes, renames or changes the behaviour of an API the system relies on. Most past breaks were silent: no error, just missing or wrong behaviour.
_Avoid_: regression (that is our own mistake, not Foundry's)

**Smoke run**:
The one command that starts a disposable Foundry of a chosen version with this system, installs the official content the way a GM does, and checks core paths, the public surface, canaries, deprecations and performance. It runs after every Foundry update and before every deploy.
_Avoid_: e2e test, integration test, smoke test

**Foundry-free module**:
A module of this system that imports nothing from Foundry, directly or through its imports, so it can be tested without a running Foundry. Pure game logic belongs here.
_Avoid_: pure module, core logic, helper

### Security

**Untrusted text**:
Any text a player wrote or that arrived with imported content (a content pack, COMP/CON data). It must never reach the page as markup, because it runs with the rights of whoever views it, including the GM.
_Avoid_: user input, raw HTML

**Canary**:
A planted, harmless payload in untrusted text that the smoke run checks for: if it ever executes, the run fails.
_Avoid_: XSS test, probe
