# Academix – instructions for Claude Code

Academix is a course / training management platform (Moodle-like), Hebrew RTL UI.
- `academix-backend/`: Express 5 + Sequelize 6 (PostgreSQL), S3/MinIO storage, NTLM or local auth.
- `academix-frontend/`: React 18 + TypeScript 4.9 (Create React App), Ant Design 5, TanStack Query, Zustand.
- How to run locally: see `README.md` (English) / `README.he.md` (Hebrew). Full project review and performance roadmap: `RAPPORT.he.md` (Hebrew).

## 0. Deployment target: a closed university network (always keep this in mind)

Academix comes from a **closed university network that is cut off from the internet**. It is developed here, outside that network, and **the goal is to redeploy it there after all the changes and additions**. Every change must stay deployable and runnable offline. Before proposing or writing anything, check it against these rules:

- **No internet at runtime.** No CDN scripts, styles or fonts (no Google Fonts), no external APIs, analytics, telemetry, error-reporting SaaS, map tiles, update checks, etc. Every asset must be bundled from npm packages or from files in the repo. Hosts and URLs come only from env vars (`.env`, `REACT_APP_*` at build time), never hard-coded.
- **Dependencies must install offline.** They reach the target as a transferred `node_modules` or through an internal npm registry. Prefer pure-JS packages. Avoid packages that download something at install or first run (browsers for puppeteer / playwright, prebuilt binaries, `node-gyp` builds); if one is unavoidable, make the binary path configurable by env var (like `FFMPEG_PATH`) and document it. Every dependency goes in `package.json` + the lock file: no global installs, no `npx <pkg>` at runtime.
- **No new external service** that cannot be installed on the closed network. If new infrastructure is needed (e.g. Redis for caching), make it optional with an in-process fallback, and document it. Docker is for local development only: production must not depend on Docker or Docker Hub.
- **Keep the closed-network modes working.** The target uses `AUTH_MODE=ntlm`, `HTTPS=true` with a `.pfx` certificate and an internal directory API (`PEOPLE_API_URL`). `AUTH_MODE=local` exists only for development outside. Never remove or break NTLM, HTTPS or the env-based configuration.
- **The production database already exists and holds real data.** Schema changes must apply to it without data loss (`npm run db:init -- --alter` or an explicit, idempotent migration); never require `--force` or a manual data fix that isn't scripted. Data that existing rows rely on (role codes, enum values) must stay compatible.
- **Node.js:** the version available on the target is not confirmed. Stay compatible with Node 20 (no APIs or syntax that need a newer Node).
- **Document every deployment impact.** If a change adds an env var, a binary, a service, a database step or a build change, say so in the PR's "Closed-network deployment impact" section. The root owner (@nathanebar) adds it to the "Redeploying on the closed network" checklist in `README.md` / `README.he.md`.

Two developers own this repo and work in parallel, each with their own Claude Code session (other developers may join on the redesign-prep Epic, see §1).
The rules below exist so that **there are never merge conflicts**. Follow them strictly.

## 1. Ownership zones

| Zone | Owner | Paths |
|---|---|---|
| Backend | @nathanebar | `academix-backend/**` (including its `package.json` / `package-lock.json`) |
| Frontend | @shneorshr1 | `academix-frontend/**` (including its `package.json` / `package-lock.json`) |
| Root / config | @nathanebar | `CLAUDE.md`, `README.md`, `README.he.md`, `CHANGES.he.md`, `RAPPORT.he.md`, `docker-compose.yml`, `.gitattributes`, `.gitignore`, `.github/**`, `.claude/**` |

- **Only edit files inside the zone of the developer you are working for.** If you don't know which zone that is, ask before editing anything.
- If a change outside the zone is needed: **stop, tell the user**, and propose an issue for the other owner. Do not make the change yourself.
- **Hot files**: even inside a zone, only one task/branch at a time may touch them:
  - Backend: `app.js`, `models/*`, `src/controllers/task.controller.js`, `src/controllers/taskAssignment.controller.js`
  - Frontend: `src/services/ApiServices.ts`, `src/types/types.ts`, `src/routes/AppRoutes.tsx`, `package.json`
- **Temporary exception (from 2026-11-25, while @shneorshr1 is on vacation):** @nathanebar may work in `academix-frontend/**`, **only on the issues of the redesign-prep Epic #97** (label `redesign-prep`). Each of those issues lists the exact files it may change; stay inside that list. The exception ends when @shneorshr1 is back: issues not yet started can then be reassigned, and an issue in progress keeps its single assignee until its PR is merged. All other frontend work still needs @shneorshr1.
- **Redesign-prep issues for other developers (from 2026-11-27):** a developer who is the GitHub **assignee** of an open `redesign-prep` issue may change the files listed in that issue's **In scope** section, and nothing else.
  - Before starting: read Epic #97 and its "Plan for new developers" comment, check that the issue's wave is open (issues of the same wave can run in parallel; the ones marked "one at a time" cannot), then assign yourself. If someone else is already assigned, pick another issue.
  - One developer works on one Epic issue at a time, and one issue has one assignee until its PR is merged.
  - A change needed outside the scope (a missing token, a kit prop, a bug in another file): stop, say so in the issue, and let @nathanebar open a follow-up issue. Do not edit the file.
  - Report bugs you find in the scope in the PR description; fix them only if the issue or @nathanebar asks.
  - Only @nathanebar merges, unless @nathanebar says otherwise in the issue.

## 2. Cross-zone changes (API contract)

Changes that affect both backend and frontend (auth, removing `X-User-Id` / `allowed*Ids` query params, pagination, response shape changes) follow this order:
1. The contract (endpoint, params, response shape) is written in the GitHub issue first, with the `contract` label.
2. Backend PR: adds the new behavior **while keeping the old one working** (backward compatible). Merge.
3. Frontend PR: migrates to the new behavior. Merge.
4. Backend PR: removes the old behavior.

Never ship a backend change that breaks the current frontend, or the reverse.

## 3. Git rules

- One task = one GitHub issue = one branch: `be/<topic>` (backend) or `fe/<topic>` (frontend), created from an up-to-date `origin/main`:
  `git fetch origin && git checkout -b be/<topic> origin/main`
- **Never commit directly to `main`.** All changes go through a Pull Request.
- Before every push: `git fetch origin && git rebase origin/main`.
- **Never force-push `main`.** Never use `git reset --hard` on shared branches.
- **Never delete a branch — local or remote.** No `git branch -d/-D`, no `git push --delete`.
- Keep PRs small (less than one day of work). Long-lived branches cause conflicts.
- Use the PR template (`.github/pull_request_template.md`).

## 4. Things that cause conflicts – do not do them

- No repo-wide reformatting (Prettier, `eslint --fix` on everything, re-indenting files you didn't otherwise change).
- No mass renames / moves of files outside the scope of the task.
- No unrelated "while I'm here" refactors in files you don't need for the task.
- Do not change line endings (`.gitattributes` enforces LF).

## 5. Dependencies

- Install packages only inside your zone (`cd academix-backend` or `cd academix-frontend`).
- On a `package-lock.json` conflict: take `main`'s version (`git checkout origin/main -- package-lock.json`), then rerun `npm install` and commit.

## 6. Database

- The schema is created from the models with `npm run db:init` (`sequelize.sync()`); the historical migrations are inconsistent (see `README.md`).
- Model / schema changes belong to the backend zone only.
- After pulling model changes: `cd academix-backend && npm run db:init -- --alter`. It only adds missing columns, indexes and enum values; it never drops or changes an existing column.
- `--alter-full` (Sequelize's full alter: changes existing columns and **drops columns that are not in a model**) and `--force` are for a local database only. **Never** run them on a shared or production database. A change to an existing column (type, nullability, rename) therefore needs an explicit, idempotent script for production (see #20).

## 7. Parallel work with Claude Code

- To run several tasks at once on one machine, use one git worktree per task (`claude --worktree`), so each session has its own folder and branch.
- After the other developer merges something: `git checkout main && git pull`, then rebase your open branch on `origin/main`.
