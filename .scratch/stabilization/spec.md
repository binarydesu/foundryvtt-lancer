# Spec: Stabilization program for the Lancer fork

Status: ready-for-agent

Vocabulary follows `CONTEXT.md`. Decisions respect ADR-0001 (keep TypeScript, stabilize in three stages), ADR-0002
(public surface and deprecation period) and ADR-0003 (fork identity). Security specifics that would help an attacker
live in the private part of the tracker until they are fixed (see `docs/agents/issue-tracker.md`).

## Problem Statement

I run my own fork of the Lancer system on Foundry VTT 14, on a NAS that also hosts other games. Foundry ships an update
roughly every month, and almost every update so far has broken something in Lancer. Most of these Foundry breaks were
silent: sheets that refused to open, chat cards that never posted, bonuses that never landed, area attacks that never
targeted anyone. I only found them by clicking through the game by hand, or in the middle of a session.

Nothing protects me from this today. The repository has no tests at all. TypeScript does not help either: it never
blocks a build, 432 type errors stand in the code, and it was blind to the last two field-path bugs because the types
are loose exactly there. Foundry announces every removal one or two versions ahead, but nobody reads those warnings
for me. Nobody has written down which parts of the system other Lancer modules rely on, so we already broke one of
them without noticing. The fork's manifest still points at upstream, so a future upstream release could replace my fork
through Foundry's own update button. And text that a player writes, or that arrives with an imported content pack, can
reach the page as markup.

I want the fork to keep working after every Foundry update, to stay compatible with the Lancer modules most tables
use, to stay easy to change, to be safe against a malicious player or content pack, and to keep the game running
smoothly.

## Solution

A safety net first, then targeted repairs, then cleanup under the net.

- **Smoke run.** One command starts a disposable Foundry of a chosen version in Docker under WSL, with the built
  system, a fresh world and the official content installed the way a GM does it. It then drives the real UI and checks
  the core paths, the public surface, the canaries, the deprecations and the performance. It takes about six minutes,
  never touches the NAS, and can check a new Foundry version before the NAS is upgraded. It runs after every Foundry
  update and before every deploy.
- **Fast gates on every push.** GitHub Actions runs the same `npm run check` that runs locally in WSL: a type gate that
  rejects new type errors, unit tests for Foundry-free modules, and a dependency audit.
- **Fork identity.** The manifest, download, url and bugs fields point at the fork, the version is distinguishable from
  upstream, and the fork publishes its own releases.
- **Untrusted text never reaches the page as markup.** A canary in every smoke run proves it.
- **The public surface is written down and checked.** A shim repairs the one break we already caused, and a module scan
  reports when a reference module starts using something new.
- **Known Foundry breaks are fixed before they land.** That covers everything with a removal version of 15 now, and the
  rest when Foundry 15 runs.
- **Cleanup under the net:** a compatibility layer, closed type holes, dead code removed.

## User Stories

### Smoke run

1. As the fork maintainer, I want one command that tells me whether Lancer still works on a given Foundry version, so that I no longer test by hand after every update.
2. As the fork maintainer, I want the smoke run to use a disposable Foundry instance, so that my NAS, my running games and my real worlds are never touched.
3. As the fork maintainer, I want to choose the Foundry version the smoke run uses, so that I can test a new Foundry release before I upgrade the NAS.
4. As the fork maintainer, I want the smoke run to start from an empty world every time, so that results never depend on leftovers from earlier runs or on my own world.
5. As the fork maintainer, I want the smoke run to create its test data from the official content, so that it represents a typical Lancer table rather than my installation.
6. As the fork maintainer, I want the smoke run to install all official content packs through the LCP manager the way a GM does, so that content import, which has broken silently before, is checked every time.
7. As the fork maintainer, I want the smoke run to log in through the real join page, dismiss first-launch tours and dialogs, and click the real HUD buttons, so that it exercises what a human would.
8. As the fork maintainer, I want every actor sheet type and every item sheet type opened and checked for errors, so that a sheet that refuses to render is caught.
9. As the fork maintainer, I want every flow a GM or player starts from the sheets run to completion, so that a flow that stops halfway is caught.
10. As the fork maintainer, I want chat cards checked for being posted with the right style and type, so that cards that silently never appear are caught.
11. As the fork maintainer, I want frame stats, core bonuses and weapon bonuses checked against known values, so that bonuses that silently stop landing are caught.
12. As the fork maintainer, I want status effects toggled on and off and checked on the actor, so that broken status handling is caught.
13. As the fork maintainer, I want a pilot and a mech linked and their passdown checked, so that broken pilot-to-mech propagation is caught.
14. As the fork maintainer, I want area templates (Blast, Line, Cone, Burst) placed on a gridded scene and their targets checked, so that area attacks that never target anyone are caught.
15. As the fork maintainer, I want dice made deterministic during checks that depend on roll results, so that results are reproducible.
16. As the fork maintainer, I want every console error and every uncaught page error reported, so that silent failures leave a trace.
17. As the fork maintainer, I want one printed verdict line and a per-step report with timings, so that I see at a glance what failed and where.
18. As the fork maintainer, I want screenshots and page HTML saved for every failing step, so that I can diagnose without re-running.
19. As the fork maintainer, I want my Foundry license activated only once, by me, and never stored in the repository, so that the smoke run stays legal and my key stays private.
20. As the fork maintainer, I want the smoke run to finish within fifteen minutes, so that I actually run it after every update.

### Deprecations

21. As the fork maintainer, I want every Foundry deprecation warning collected with its since and until versions, so that I see removals before they happen.
22. As the fork maintainer, I want each warning attributed to Lancer, Foundry core or a module, with the Lancer source location, so that I know which warnings I can fix.
23. As the fork maintainer, I want the smoke run to fail on a Lancer warning whose removal version is the next Foundry major, so that a Foundry break never reaches me unannounced.
24. As the fork maintainer, I want later removals reported without failing the run, so that the gate stays meaningful.

### Performance

25. As a GM, I want the game to stay smooth after every change and every Foundry update, so that sessions are not interrupted by stutter.
26. As the fork maintainer, I want data preparation, sheet render time, flow duration, actor update round trip and long main-thread tasks measured on a scene with about fifteen tokens, so that slowdowns are visible.
27. As the fork maintainer, I want each run compared with the last baseline and failed on a large regression or a single very long task, so that performance does not erode unnoticed.
28. As the fork maintainer, I want Foundry updates measured too, so that I notice when a new Foundry version makes Lancer slower.

### Fast gates

29. As the fork maintainer, I want every push to the fork checked automatically, so that problems surface without me remembering to run anything.
30. As the fork maintainer, I want a commit that adds a type error rejected, so that the type situation only gets better from here.
31. As the fork maintainer, I want the type gate to compare error sets rather than counts, so that fixing one error cannot hide a new one.
32. As the fork maintainer, I want the type baseline to shrink when errors are fixed, so that progress cannot be lost.
33. As the fork maintainer, I want the same checks available locally as one command in WSL, so that I and the implementing agent get the same answer as CI.
34. As the fork maintainer, I want vulnerable dependencies in the shipped bundle reported on every push, so that supply-chain issues do not slip in.
35. As the implementing agent, I want fast unit tests for pure game logic, so that I can work test-first without starting Foundry.
36. As the implementing agent, I want a check that fails when a Foundry-free module starts importing Foundry, so that the unit-testable part does not erode.

### Fork identity

37. As the fork maintainer, I want Foundry's update button to see only my fork's releases, so that an upstream release can never replace my fixes.
38. As the fork maintainer, I want the fork's version number distinguishable from upstream's, so that I can always tell which build is running.
39. As someone installing the fork, I want a manifest URL that installs and updates it, so that I do not need shell access to deploy.
40. As the fork maintainer, I want the package id to stay `lancer`, so that the reference modules keep working.

### Untrusted text

41. As a GM, I want text written by players to be shown as text and formatting only, never as running code, so that a player cannot act with my GM rights.
42. As a GM, I want imported content packs and COMP/CON data treated the same way, so that a manipulated content pack cannot attack my table.
43. As a GM, I want official content to keep its formatting (line breaks, lists, bold, italics), so that hardening does not degrade the books' text.
44. As the fork maintainer, I want existing worlds cleaned by a migration, so that text stored before the fix is safe too.
45. As the fork maintainer, I want canaries planted by a player account in every smoke run, so that the protection is proven every time and cannot regress.

### Public surface

46. As a module author, I want a written list of everything of the system I may rely on, so that I know what is stable.
47. As a module author, I want parts of the public surface replaced only with a deprecation period and a warning naming the removal version, so that my module keeps working while I adapt.
48. As the fork maintainer, I want the smoke run to check that every part of the public surface still exists and behaves as documented, so that I never break a reference module unknowingly.
49. As the fork maintainer, I want hooks checked to fire with their documented arguments during the flows, so that hook-based modules keep working.
50. As the fork maintainer, I want data paths, CSS classes, asset paths and the documented setting checked too, so that the whole surface is covered, not just functions.
51. As the fork maintainer, I want a report after every Foundry-update run listing anything the latest reference module releases use that the list does not contain, so that the contract follows the modules.
52. As a user of lancer-weapon-fx, I want its manual area macros to work again, so that its smoke and area effects appear on the map.

### Known breaks and fresh-world bugs

53. As the fork maintainer, I want the mech sheet's context menu moved off the API Foundry removes in version 15, so that it keeps working after the next major update.
54. As a GM on a fresh world, I want chat cards posted without relying on an API Foundry removes in version 16, so that cards keep appearing then.
55. As a GM on a fresh world, I want no prompt that is meant for worlds migrating from old versions, so that first launch is clean.
56. As a GM, I want dialogs to open in front of the window that opened them, so that I never wait on a prompt I cannot see.

### Cleanup

57. As the fork maintainer, I want every call to the Foundry APIs that broke before routed through one compatibility layer, so that the next Foundry break is repaired in one place.
58. As the implementing agent, I want stat and field paths typed instead of free strings, so that a wrong path fails the type check instead of rolling a silent +0.
59. As the implementing agent, I want model access without `any`, so that TypeScript sees what the code touches.
60. As the fork maintainer, I want dead code and the dead pre-commit setup removed, so that the codebase only contains what runs.
61. As the fork maintainer, I want nothing on the public surface removed during cleanup, so that the reference modules keep working.

## Implementation Decisions

### Smoke run

- **Two parts.** A shell orchestration script runs in WSL. A browser driver runs in the official Playwright container
  and talks to Foundry over a private Docker network. Both live in the repository's scripts area. Shell scripts are
  forced to LF line endings through git attributes, because Windows checkouts otherwise break them.
- **Foundry instance.** Foundry runs from an unzipped Node.js release in a pinned Node 24 container (Foundry 14.369
  requires Node >= 24.13.1 < 25). The data directory is fresh for every run and wiped at the start of the next one;
  artifacts stay until then. The Foundry install, the zips, the driver's dependencies and the license seed live in a
  per-machine cache outside the repository. Foundry zips come from the NAS container cache, which keeps every version
  the NAS has run, or from a manual download for versions the NAS has not seen yet.
- **Pinned versions.** Container images and the Playwright package use exact versions:
  `node:24.22.1-bookworm-slim`, `mcr.microsoft.com/playwright:v1.64.1-noble` and `playwright@1.64.1`.
- **License.** On the first run without a license seed, the run pauses. The user opens the local instance, enters
  their key and accepts the EULA. The run then stores the signed license file in the per-machine cache with owner-only
  permissions. The container hostname is fixed so the signature stays valid. The key never enters the repository, a log
  or a report.
- **World and users.** The world comes from a hand-written manifest and auto-launches at startup. Foundry creates the
  Gamemaster user itself. The run creates a password-less player user as test data, gives it ownership of its pilot and
  mech, and drives it in a second browser context.
- **First-launch handling (learned in the prototype).**
  - The v14 join form names its user field `userId`, and it re-renders once its socket connects. Wait for network
    idle, select the user, check the selection holds, then join.
  - Foundry's welcome tour starts about two seconds after ready on a new world. Wait for
    `foundry.nue.Tour.activeTour`, then exit it; racing it does not work.
  - Close Lancer's welcome dialog, then use "Import/Update Selected" with every official pack pre-selected. There is no
    confirmation. The import is done when the installed-LCP index holds every selected pack (about 340 s for nine packs).
- **Core paths.**
  - Every actor sheet type and item sheet type renders without error.
  - These flows run to completion through the real HUD, with their chat cards checked: weapon attack and damage, tech
    attack, basic attack, stat and skill checks, structure, overheat, stabilize, full repair, overcharge, core active,
    NPC recharge, system, talent and bond activation, and burn.
  - Frame stats, core-bonus and weapon bonuses land. Statuses toggle. A linked pilot and mech share passdown.
  - Blast, Line, Cone and Burst templates target correctly on a temporarily gridded scene.
  - Dice are made deterministic where results matter, by overriding the dice term's roll and random-face functions.
    Overriding `CONFIG.Dice.randomUniform` alone does not work.
- **Report and verdict.** Each step prints its state and timing. A final verdict line reads `SMOKE: PASS` or
  `SMOKE: FAIL`, and the process exit code matches it. Callers in WSL gate on the printed verdict, because `$?` is
  unreliable in that shell.
- **Out of the run:** COMP/CON share-code import, because it depends on an external service. Its parsing is covered
  by unit tests on recorded data instead.

### Deprecation gate

- Console capture starts before the page loads. Foundry's warnings carry "Deprecated since Version N" and "removed in
  Version M". A warning is Lancer's when its stack runs through the system's files, and its location is mapped back to
  TypeScript source through the shipped source maps.
- The run fails on a Lancer warning whose `until` is at most the current Foundry major plus one. Everything else is
  reported. There is no hand-maintained list; each run's report is the list.

### Performance

- **Test scene.** A scene with about fifteen tokens: kitted mechs, pilots and NPCs.
- **Measured:** data preparation per actor, render time per sheet type, flow duration without the time spent waiting
  for the HUD, actor-update round trip including hooks, and long tasks (main thread blocked more than 50 ms) through
  a long-task observer.
- **Baseline.** The baseline is per machine and lives in the per-machine cache, not the repository. The first run
  writes it.
- **Gate.** A run fails when a measured value is more than 50 % worse than the baseline, or when any single task during
  a flow or sheet render exceeds 200 ms. Both thresholds are calibrated on the first measurement.
- FPS is not measured: headless Chromium has no GPU.

### Fast gates

- **`npm run check`** runs the type gate, the unit tests, the Foundry-free import check and the dependency audit, and
  builds the system. The same script runs locally in WSL and in a GitHub Actions workflow on every push to the fork, on
  any branch. The smoke run is not part of CI, because it needs the license.
- **Type gate (ADR-0001, stage 1).** A baseline of error signatures (file, error code and message, without line and
  column) is checked into the repository. A signature that is not in the baseline fails the gate. When errors
  disappear, the baseline is rewritten so they cannot come back.
- **Unit tests.** Vitest, on Foundry-free modules only, with no Foundry mocks.
- **Foundry-free import check.** It fails when a Foundry-free module imports a module that depends on Foundry,
  directly or transitively, or touches Foundry globals.
- **Dependency audit.** It covers the dependencies that end up in the shipped bundle.
- **Dead setup.** The husky and lint-staged setup never ran anywhere: no hook path is set, and Windows has no Node. It is
  removed.

### Fork identity (ADR-0003)

- The system manifest's url, manifest, download and bugs fields point at the fork.
- The version scheme must be distinguishable from upstream and must order correctly under Foundry's
  `isNewerVersion`. The ticket picks the scheme and proves the ordering.
- The existing release workflow publishes releases on the fork when a version tag is pushed.

### Untrusted text

- Rule: untrusted text never reaches the page as markup. Text fields that are rendered as markup are sanitized by
  Foundry on the server when they are saved. Official content keeps its formatting, which uses line breaks, lists,
  bold, italics, spans and code.
- A world migration re-saves affected text in actors, items and the world compendia, so stored text is cleaned too.
- Data paths and value types do not change, so the public surface is unaffected.
- The smoke run plants canaries through the player account into every untrusted text field of every actor and item
  type, opens every sheet as GM, posts the related chat cards, and fails if any canary executes.
- The concrete fields, the rendering sites and the probe are in the private spec.

### Public surface (ADR-0002)

- **Written list.** `docs/public-api.md` is the human-readable list. A machine-readable manifest next to it lists every
  entry with its kind and the reference modules that use it: function or method, hook with argument shape, data path
  per document type, setting, asset path, and CSS class.
- **Contract checks.** The smoke run consumes the manifest. Functions and methods must exist. Hooks must fire with the
  documented arguments during the flows the run already performs. Data paths must be present on the kitted mech,
  pilot and NPC. CSS classes must appear in the rendered sheets and cards. Asset paths must answer 200. The setting must
  be registered.
- **Module scan report.** A script fetches the latest release of each reference module, extracts its uses of the
  system, and reports entries missing from the manifest. It reads compendium-pack macros as well as scripts, because
  the earlier scan missed weapon-fx's macros, which live in compendium packs. The report never fails a run. It runs
  with every Foundry-update smoke run.
- **Template shim.** `WeaponRangeTemplate.fromRange(...).placeTemplate()` keeps resolving to a Region, but it accepts
  the MeasuredTemplate-style update the reference modules send:
  - `fillColor` maps onto the Region's colour.
  - `distance` maps onto the size of its shapes, converted from grid units to pixels.
  - `texture` has no counterpart: the Region schema of 14.369 has no texture field. It is kept on the document flags and
    logged as a deprecation with a removal version.
  - The ticket verifies this with a weapon-fx-style macro call in the smoke run.

### Known breaks and fresh-world bugs

- The mech sheet's context menu passes an HTML element, not jQuery. Foundry removes the jQuery path in version 15.
- Roll-mode normalization handles the unset core roll-mode setting of a fresh world, without falling back to the
  chat-message roll-mode API that Foundry removes in version 16.
- The compendium-manager tour prompt is shown only to worlds migrating from versions before 2.7.0. On a fresh world the
  migration-version setting's default must not count as "old".
- Dialogs opened from the LCP manager appear in front of it. This window-ordering problem comes from mixing V1 and V2
  application windows.

### Cleanup

- **Compatibility layer.** One module owns the Foundry APIs that broke before: chat-message creation with roll mode,
  templates and regions, grid measurement, registration of active-effect change types, Handlebars helpers that core
  removed, and context menus. Its interface is a small set of intention-revealing functions. The rest of the system
  calls only those.
- **Type holes (ADR-0001, stage 2).** Stat and field paths become a union of valid paths instead of a string, with
  `beginStatFlow` as the first user. Model access loses its `any` casts, and flow state is typed.
- **Dead code** is deleted only outside the public surface, after a check against the manifest. Known candidates: an
  unrendered combat-tracker config template that still uses a removed helper, and the husky setup.

## Testing Decisions

- **What makes a good test here.** It observes what a GM, a player or a module would observe: values on the prepared
  actor, a sheet that rendered, a chat card that was posted with a given style, a hook that fired with given arguments,
  a canary that did not execute. It does not observe internal call order. There are no Foundry mocks anywhere, because
  a mock stays green while the real Foundry breaks.
- **Seam 1, the smoke run.** It drives a disposable Foundry from outside through the browser. Setup and assertions use
  the real UI where a human would act, and the public surface for everything else. This seam covers everything that
  needs Foundry: core paths, the contract, canaries, deprecations and performance.
- **Seam 2, Vitest on Foundry-free modules.** First candidates:
  - the structure and overheat table-to-condition mapping
  - LCP v2 and v3 parsing, including the NPC collection files and both weapon damage shapes
  - the legendary dice rule
  - roll-mode normalization
  - the text-cleaning helper behind the untrusted-text fix
  - COMP/CON share-code parsing on recorded data

  Each candidate first moves into a Foundry-free module.
- **Test-first for every repair.**
  - The ContextMenu fix is driven by the deprecation gate going from red to green.
  - The untrusted-text fix is driven by the canaries going from red to green.
  - The template shim is driven by a weapon-fx-style macro call whose colour and size must land.
  - The fresh-world fixes are driven by smoke-run checks on first launch.
- **Prior art.** The repository has no tests. The local branch `prototype/smoke-driver` holds a working end-to-end
  driver, which passed against Foundry 14.369 in 360 s, and a probe for untrusted text. Both are throwaway primary
  sources for the real harness. The branch stays local until the untrusted-text fix is pushed.

## Out of Scope

- The ApplicationV2 sheet migration. It is a separate follow-up program with its own spec, and it decides there how
  subclassing of the sheet classes breaks.
- TypeScript stage 3 (zero errors and a build gate on `fvtt-types` for Foundry 14). It waits until those types exist.
- Loading the real reference modules into the smoke world.
- Running the smoke run in CI, which would need license secrets.
- A Foundry package-directory listing, support for other users, and any upstream contribution or report.
- Feature work: conditions for `meltdown.2` and `direct.2`, NPC import via COMP/CON share code, the optional "survive at
  zero structure" rule, clickable deployable action chips, and condition automation for structure and overheat outcomes.
- Performance tuning without a measured regression.
- Threats outside the threat model: the Foundry server, other modules, and hosting or the NAS.

## Further Notes

- **Ticket order, agreed with the user:**
  1. fast gates
  2. fork identity
  3. smoke run (starts red because of the ContextMenu warning)
  4. ContextMenu fix
  5. Vitest and the first Foundry-free modules
  6. untrusted-text canary and fix
  7. public surface (list, contract gate, scan report, template shim)
  8. fresh-world bugs and the roll-mode fallback
  9. cleanup
- **Reference modules (ADR-0002), the eleven most-installed maintained Lancer modules by Forge Bazaar installs,
  2026-10-26:**

  | Module | Forge installs |
  |---|---|
  | lancer-initiative | 3.25 % |
  | lancer-weapon-fx | 3.23 % |
  | lancer-clocks | 2.71 % |
  | lancer-speed-provider | 2.33 % |
  | csm-lancer-qol | 2.28 % |
  | token-action-hud-lancer | 1.67 % |
  | lancer-communicator | 1.02 % |
  | lancer-alternative-sheets | 0.76 % |
  | moss-lancer | 0.55 % |
  | ilysen-lancer-npc-rebake-structure | 0.23 % |
  | lancer-npc-creator | 0.23 % |

  For comparison, the Lancer system itself is at 5.41 %.
- **Environment.**
  - The Windows host has no Node. Builds, checks and the smoke run happen in Debian WSL.
  - WSL's `/tmp` is wiped between calls, so state lives in the home directory.
  - Gate on printed verdicts, because `$?` is unreliable in that shell.
- **Deploying** replaces the live build on the NAS while players may be connected, so it needs the user's
  confirmation. The smoke run must pass first.
- **AppV1 removal** is confirmed from Foundry's source as version 16. The AppV2 program must be finished before the
  move to Foundry 16, and it should start no later than the move to Foundry 15.
