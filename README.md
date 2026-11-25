# Academix

**English** · [עברית](README.he.md)

Academix is a course and training management platform (similar to Moodle) with a Hebrew, right-to-left interface.

> **Origin and goal.** Academix comes from a **closed university network with no internet access**. It is being developed and improved outside that network, and the goal is to **redeploy it there** once the changes are done. Everything in this repository must therefore keep working offline: see [Redeploying on the closed network](#redeploying-on-the-closed-network).

## Repository layout

| Path | Content |
|---|---|
| `academix-backend/` | REST API: Express 5 + Sequelize 6 (PostgreSQL), S3 / MinIO file storage, NTLM **or** username/password authentication |
| `academix-frontend/` | Web app: React 18 + TypeScript (Create React App), Ant Design 5, TanStack Query, Zustand |
| `docker-compose.yml` | Local infrastructure for development: PostgreSQL 16 + MinIO |
| `CLAUDE.md` | Collaboration rules (ownership zones, git workflow, closed-network constraints) |
| `RAPPORT.he.md` | Full project review and performance roadmap (Hebrew) |
| `DEPLOY.he.md` | Step-by-step deployment on the closed network: export, merge into the internal GitLab, backups, rehearsal, rollback (Hebrew) |

## Running locally (outside the closed network)

Requirements: Node.js 20 or later, Docker Desktop.

```bash
# 1. Infrastructure
docker compose up -d            # Postgres :5432, MinIO :9000 (console :9001, minioadmin / minioadmin)

# 2. Backend
cd academix-backend
cp .env.example .env            # then set a random JWT_SECRET
npm ci
npm run db:init                 # creates every table from the models, plus the triggers
npm run db:seed                 # roles, "Academix" system, admin / admin user (SYSTEM-ADMIN)
npm run dev                     # http://localhost:8007

# 3. Frontend (another terminal)
cd academix-frontend
npm ci                          # .env.development is already provided
npm start                       # http://localhost:3000 -> login page
```

Create more accounts: `npm run user:create -- <username> <password> [name] [militaryid]` (in `academix-backend/`).

Demo data (local only): `npm run db:seed:demo` (in `academix-backend/`, after `db:seed`) creates domains, courses, batches, teams, students and dated tasks. Every demo user has the password `1234`: `domain1`, `course1`, `tc_c1b1t1` (team commander), `st_c1b1t1_1` (student). It does nothing if the data already exists and refuses to run with `NODE_ENV=production`.

### Infrastructure ports

If a port is already in use (for example a PostgreSQL installed on Windows already listens on 5432), create a `.env` file at the root of the repository (ignored by git):

```bash
POSTGRES_PORT=5433
MINIO_PORT=9000
MINIO_CONSOLE_PORT=9001
```

Then use the same values in `academix-backend/.env` (`DB_PORT=5433`, `S3_ENDPOINT=http://localhost:<MINIO_PORT>`) and, if `MINIO_PORT` changes, in the frontend's `REACT_APP_S3_BASE_URL` (`academix-frontend/.env.development.local`).

The MinIO image is `cgr.dev/chainguard/minio`, pinned by digest in `docker-compose.yml`: `minio/minio` and `minio/mc` are no longer published on Docker Hub.

### Authentication

| `AUTH_MODE` | Used | How it works |
|---|---|---|
| `local` | outside the closed network (development) | `POST /api/auth/login` checks `Users.password` (native Node scrypt hash) and sets the `token` (httpOnly JWT) and `userInfo` cookies. The frontend shows a login page and a logout button. |
| `ntlm` | on the closed network | `GET /api/auth/ntlm` (express-ntlm with `NTLM_DOMAIN` / `NTLM_DOMAIN_CONTROLLER`), the original behavior. `/api/auth/login` does not exist in this mode. |

The frontend reads the mode from `GET /api/auth/mode`. Every other `/api` route requires the `token` cookie; without it the API answers `401 { "error": "unauthenticated" }`. The user and the active role always come from the server: the token gives the user, and the `X-Role-Assignment-Id` header names one of their role assignments, checked server-side ([#13](https://github.com/nathanebar/academix/issues/13)). `REQUIRE_AUTH=false` disables the check for local development only (requests then run anonymously).

### Database

The migrations in `academix-backend/migrations/` are **inconsistent**: `TeamCourseBatches` is never created, some foreign keys point to tables created later, there are duplicates, invalid timestamps and missing tables. The schema is therefore created by `npm run db:init` (`sequelize.sync()` from the models).

| Command | Effect |
|---|---|
| `npm run db:init` | creates the missing tables only |
| `npm run db:init -- --alter` | also adds missing columns, indexes and enum values to existing tables (run it after pulling model changes). It never drops or changes an existing column, so it is safe on the production database |
| `npm run db:init -- --alter-full` | Sequelize's full alter: also **changes** existing columns to match the models and **drops columns that are not in a model, with their data**. Local development only |
| `npm run db:init -- --force` | **drops and recreates every table**. Never on a shared or production database |
| `npm run db:check-duplicates` | read-only: lists duplicate rows of the pairs that should be unique (#35); changes nothing |

### Media

The `academix-frontend/src/media/` folder was not fully extracted. `npm run media:placeholders` (in `academix-frontend/`) generates neutral images at the expected paths (87 files). It never overwrites an existing file, so copying the real media over them is enough.

## Contributing

Two developers work in parallel, each with their own Claude Code session. The rules are in [`CLAUDE.md`](CLAUDE.md). In short:

- Backend and root files: @nathanebar. Frontend: @shneorshr1. Only edit your own zone.
- One task = one GitHub issue = one branch (`be/<topic>` or `fe/<topic>`) = one small pull request. `main` is protected.
- The work plan is tracked in the pinned issue [#23](https://github.com/nathanebar/academix/issues/23).

## Redeploying on the closed network

The target has **no internet access**: everything it needs must be brought in. The full step-by-step procedure (export, merge into the internal GitLab without overwriting the real media, backups, rehearsal on a copy, checks, rollback) is in [`DEPLOY.he.md`](DEPLOY.he.md) (Hebrew); the list below is the summary.

1. **Offline dependencies**: transfer `node_modules` (same OS and same Node version as the target), or an npm cache / internal registry (Verdaccio). For the frontend, transferring only the `build/` folder is also enough. Docker is used for local development only; the target does not need it.
2. **ffmpeg**: `@ffmpeg-installer` contains a binary for one OS. If the platform differs, provide the binary and set `FFMPEG_PATH`.
3. **Backend `.env`**:
   - `NODE_ENV=production`
   - `AUTH_MODE=ntlm`, `NTLM_DOMAIN`, `NTLM_DOMAIN_CONTROLLER`
   - `REQUIRE_AUTH` left unset or `true` (**never `false` in production**); `JWT_EXPIRES_IN` (default `12h`) sets how long a session lasts. After deploying, check that an expired session silently logs back in through NTLM (the frontend calls `GET /api/auth/ntlm` once on a 401): this path cannot be tested outside the closed network.
   - `HTTPS=true`, `CERT_PATH=certificate/cert.pfx`, `PASSWORD=<passphrase>`
   - `DB_*`: according to the logs, the old database probably ran on port **5433**
   - `S3_*` (plus `S3_STORAGE_CLASS=STANDARD_IA` if that was the case before)
   - `CORS_ORIGINS=<frontend URL>`
   - `PEOPLE_API_URL` / `PEOPLE_API_COOKIE` for the directory search (use a service account; do not reuse the cookie that used to be hard-coded)
   - Directory API certificate: it is now **verified**. If it is signed by an internal authority, set `PEOPLE_API_CA_FILE=<CA certificate, PEM>` (or `NODE_EXTRA_CA_CERTS`). Only if that CA cannot be provided, `PEOPLE_API_INSECURE_TLS=true` restores the old behavior (no verification). Check that user search and photos work after deploying.
4. **Existing database**: take a `pg_dump` first. Never run `db:init -- --force`. `db:init` without options only creates missing tables; `db:init -- --alter` adds what the models added (columns, indexes, enum values) and never drops or changes an existing column. Never run `--alter-full` there.
   - Run `npm run db:check-duplicates` (read-only) and send its output back: it shows the clean-up needed before the batch-status and team-course-batch pairs can be made unique (#35).
5. **Frontend**: build with the target's variables, for example:
   `REACT_APP_API_BASE_URL=https://<api>:8007/api REACT_APP_S3_BASE_URL=https://<minio> REACT_APP_PHOTO_API_URL=... REACT_APP_CHAT_URL=... npm run build:prod`
   The `userInfo` cookie must be readable by the frontend: serve the frontend and the API from the same host, or behind a reverse proxy.
6. Put the real media back in `academix-frontend/src/media/` before the build.
7. Use a clean `.env` on the target. Do not reuse `config/config.json`: it contains old passwords and is no longer used.
8. Check the merged pull requests since the last deployment: each one has a "Closed-network deployment impact" section listing the extra steps it needs (new variables, binaries, database steps).

## Known security issues (not fixed yet)

Tracked in the work plan ([#23](https://github.com/nathanebar/academix/issues/23)):

- Production logs written **before** the new logger (`academix-backend/logs/errors.log`, `info.log`, `debug.log`, ignored by git) contain IPs, usernames and request bodies: purge them before sharing anything. The current logger no longer writes request bodies.

Fixed since the review: client-trusted identity and permissions ([#13](https://github.com/nathanebar/academix/issues/13)), SQL injection ([#8](https://github.com/nathanebar/academix/issues/8)), security headers, login rate limit, internal error messages and the unverified directory TLS ([#15](https://github.com/nathanebar/academix/issues/15), [#53](https://github.com/nathanebar/academix/issues/53)).
