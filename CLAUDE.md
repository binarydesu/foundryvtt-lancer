# foundryvtt-lancer — binarydesu fork

## Agent skills

### Issue tracker

Issues and specs live as local markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

The five default triage roles, recorded as a `Status:` line in each issue file. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` plus `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Checks

`npm run check` runs the fast gates (type gate, build, audit of the shipped bundle) in Debian WSL, and GitHub Actions
runs it on every push. Gate on its last line, `CHECK: PASS` or `CHECK: FAIL`, not on `$?`. When it shrinks
`scripts/check/type-baseline.jsonl`, commit that file with the fix. How each gate works is described at the top of
`scripts/check/*.mjs`.
