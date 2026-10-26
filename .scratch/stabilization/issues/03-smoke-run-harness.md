# 03 — Smoke run: harness

**What to build:** The first tracer bullet through the smoke run (see `CONTEXT.md`). One command in WSL does all of the
following:

1. Starts a disposable Foundry of a chosen version in Docker, with the built system.
2. Creates a fresh world and logs in as Gamemaster through the real join page.
3. Clears the first-launch tour and dialogs.
4. Installs every official content pack through the LCP manager, the way a GM does.
5. Builds one mech from the compendium and checks its frame stats.
6. Opens its sheet and runs one stat flow through the real HUD.
7. Checks the chat card and prints a per-step report and one verdict line.

All later smoke tickets add steps to this harness.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

Spec: `.scratch/stabilization/spec.md`, user stories 1–7, 10, 15–20 and section "Smoke run".

- [ ] One command in WSL takes the Foundry version as a parameter. The default is the version the NAS runs (14.369).
- [ ] It prints a per-step report with timings and a final `SMOKE: PASS` or `SMOKE: FAIL` line. The exit code matches.
- [ ] Foundry runs from an unzipped release in the pinned Node container. The browser driver runs in the pinned
      Playwright container. They talk over a private Docker network.
- [ ] Foundry's port is bound to localhost only.
- [ ] The NAS is only read from: Foundry zips come from its container cache, and nothing on the NAS changes.
- [ ] Every run starts from a fresh data directory. The previous run's directory is wiped at the start of the next run,
      and artifacts stay until then.
- [ ] Foundry installs, zips, driver dependencies and the license seed live in a per-machine cache outside the
      repository.
- [ ] Without a license seed, the run pauses. The user activates Foundry once and accepts the EULA, and the run stores
      the signed license with owner-only permissions. The existing seed from the prototype is reused.
- [ ] The license key never appears in the repository, the log or an artifact. A check in the run greps the artifacts
      for it.
- [ ] Login uses the real join page. The first-launch handling follows the prototype: wait for network idle, keep the
      user selection, wait for the welcome tour to start and then exit it, and close Lancer's welcome dialog.
- [ ] Every official pack installs through "Import/Update Selected". The step is done when the installed-LCP index
      holds every selected pack.
- [ ] A mech built from the official Everest frame, with no pilot, shows HP 10, Evasion 8, E-Def 8, Heat 6, Speed 4
      and Armor 0.
- [ ] Its sheet renders.
- [ ] A HULL stat check runs through the real HUD and posts a chat card with the expected style and type.
- [ ] Console messages and page errors are captured from before the page loads and listed in the report. Ticket 04
      evaluates the deprecations, and ticket 06 decides which errors fail the run.
- [ ] A failing step saves a screenshot and the page HTML.
- [ ] The whole run takes less than 15 minutes.
- [ ] Shell scripts are forced to LF line endings through git attributes.
- [ ] The run never touches anything outside its own containers, cache and artifacts.

## Prototype

The local branch `prototype/smoke-driver`, commit `4a3726f3`, holds a working throwaway version. It passed against
14.369 in 360 s, of which the import took 340 s. Read it with `git show` and do not check the branch out. **Never push
that branch:** a later commit on it holds an unfixed security probe (see ticket 14).

How the prototype starts Foundry and the driver. This shows the network, the read-only mounts, the fixed hostname (the
license signature depends on it) and the localhost-only port:

```sh
docker run -d --name $FC --network $NET --hostname lancer-smoke --user "$(id -u):$(id -g)" \
  -p 127.0.0.1:$HOSTPORT:30000 \
  -v "$BASE/foundry/$FVER:/foundry:ro" -v "$RUN:/data" -v "$DIST:/data/Data/systems/lancer:ro" \
  node:24.22.1-bookworm-slim node /foundry/main.mjs --dataPath=/data --port=30000 --noupnp --noupdate --world=smoke

docker run --rm --init --ipc=host --network $NET --user "$(id -u):$(id -g)" -e HOME=/tmp \
  -e FOUNDRY_URL="http://$FC:30000" ... mcr.microsoft.com/playwright:v1.64.1-noble ...
```

The world manifest is hand-written. Its fields are `id`, `title`, `system: "lancer"`, `coreVersion` and
`compatibility`.

The first-launch sequence that works on v14:

```js
// join: v14 names the field "userId"; the AppV2 form re-renders once its socket connects
await page.waitForLoadState("networkidle");
await sel.selectOption({ label: gm }); if (!(await sel.inputValue())) retry();
// tour: starts ~2 s after ready, after the default scene is created — wait for it, then exit
await page.waitForFunction(() => foundry.nue.Tour.activeTour?.id);
await page.evaluate(() => foundry.nue.Tour.activeTour?.exit());
// import: every official row is pre-selected; bulk import has no confirmation
await page.locator("button.lcp-bulk-import").click();
await page.waitForFunction(n => (game.settings.get("lancer", "installedLCPs")?.index?.length ?? 0) >= n, selected);
```
