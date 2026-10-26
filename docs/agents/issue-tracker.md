# Issue tracker: Local Markdown

Issues and specs (you may know a spec as a PRD) for this repo live as markdown files in `.scratch/`.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`
- The spec is `.scratch/<feature-slug>/spec.md`
- Implementation issues are one file per ticket at `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01` — never a single combined tickets file
- Triage state is recorded as a `Status:` line near the top of each issue file (see `triage-labels.md` for the role strings)
- Comments and conversation history append to the bottom of the file under a `## Comments` heading

## When a skill says "publish to the issue tracker"

Create a new file under `.scratch/<feature-slug>/` (creating the directory if needed).

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. The user will normally pass the path or the issue number directly.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a file with one **child** file per ticket.

- **Map**: `.scratch/<effort>/map.md` — the Notes / Decisions-so-far / Fog body.
- **Child ticket**: `.scratch/<effort>/issues/NN-<slug>.md`, numbered from `01`, with the question in the body. A `Type:` line records the ticket type (`research`/`prototype`/`grilling`/`task`); a `Status:` line records `claimed`/`resolved`.
- **Blocking**: a `Blocked by: NN, NN` line near the top. A ticket is unblocked when every file it lists is `resolved`.
- **Frontier**: scan `.scratch/<effort>/issues/` for files that are open, unblocked, and unclaimed; first by number wins.
- **Claim**: set `Status: claimed` and save before any work.
- **Resolve**: append the answer under an `## Answer` heading, set `Status: resolved`, then append a context pointer (gist + link) to the map's Decisions-so-far in `map.md`.

## Undisclosed security issues

This repository is public. A spec section or ticket that describes an **open** security hole in enough detail to exploit
it goes to `.scratch/private/<feature-slug>/` instead, using the same layout. That folder is git-ignored. Once the fix is
committed and pushed, move the files into `.scratch/<feature-slug>/` and commit them like any other ticket. Never push a
branch that contains exploit details (for example a probe or proof of concept) before the fix is out.

## Where tickets do NOT go

- `.scratch/` is committed to git, so worktree sessions and the history see ticket state.
- GitHub issues are disabled on `binarydesu/foundryvtt-lancer`. Never file issues or PRs on
  `origin` (`Eranziel/foundryvtt-lancer`) — upstream does not accept AI-written contributions.
  Inside this clone, `gh` resolves to `origin` unless a default is set; pass
  `-R binarydesu/foundryvtt-lancer` explicitly.
