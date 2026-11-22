# Academix – instructions for Claude Code

Academix is a course / training management platform (Moodle-like), Hebrew RTL UI.
- `academix-backend/`: Express 5 + Sequelize 6 (PostgreSQL), S3/MinIO storage, NTLM or local auth.
- `academix-frontend/`: React 18 + TypeScript 4.9 (Create React App), Ant Design 5, TanStack Query, Zustand.
- How to run locally: see `README.md`. Full project review and performance roadmap: `RAPPORT.he.md` (Hebrew).

Two developers work on this repo in parallel, each with their own Claude Code session.
The rules below exist so that **there are never merge conflicts**. Follow them strictly.

## 1. Ownership zones

| Zone | Owner | Paths |
|---|---|---|
| Backend | @nathanebar | `academix-backend/**` (including its `package.json` / `package-lock.json`) |
| Frontend | @shneorshr1 | `academix-frontend/**` (including its `package.json` / `package-lock.json`) |
| Root / config | @nathanebar | `CLAUDE.md`, `README.md`, `CHANGES.he.md`, `RAPPORT.he.md`, `docker-compose.yml`, `.gitattributes`, `.gitignore`, `.github/**`, `.claude/**` |

- **Only edit files inside the zone of the developer you are working for.** If you don't know which zone that is, ask before editing anything.
- If a change outside the zone is needed: **stop, tell the user**, and propose an issue for the other owner. Do not make the change yourself.
- **Hot files**: even inside a zone, only one task/branch at a time may touch them:
  - Backend: `app.js`, `models/*`, `src/controllers/task.controller.js`, `src/controllers/taskAssignment.controller.js`
  - Frontend: `src/services/ApiServices.ts`, `src/types/types.ts`, `src/routes/AppRoutes.tsx`, `package.json`

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
- After pulling model changes: `cd academix-backend && npm run db:init -- --alter`. **Never** run `--force` on a shared or production database.

## 7. Parallel work with Claude Code

- To run several tasks at once on one machine, use one git worktree per task (`claude --worktree`), so each session has its own folder and branch.
- After the other developer merges something: `git checkout main && git pull`, then rebase your open branch on `origin/main`.
