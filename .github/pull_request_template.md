## Linked issue
Closes #

## Zone
- [ ] Backend (`academix-backend/`)
- [ ] Frontend (`academix-frontend/`)
- [ ] Root / config

## Summary
<!-- What changed and why, in a few lines -->

## How it was tested
<!-- Commands run, pages checked, endpoints called -->

## Closed-network deployment impact
<!-- Academix is redeployed on a closed network with no internet (see CLAUDE.md §0).
     List what the redeployment needs because of this PR: new env vars, binaries, services,
     database steps (e.g. `db:init -- --alter`), build changes. Write "None" if nothing. -->

## Checklist
- [ ] Only files from my zone are modified
- [ ] Rebased on the latest `origin/main`
- [ ] No unrelated reformatting or renames
- [ ] API contract change? If yes: backward compatible, and described in the issue (label `contract`)
- [ ] DB model change? If yes: mention that `npm run db:init -- --alter` is needed
- [ ] Works offline: no CDN / external API / runtime download, new dependencies install from `package.json` + lock file (CLAUDE.md §0)
