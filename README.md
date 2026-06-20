# Pocket Locker

A pocket sized file-storage SaaS: sign up, upload files (up to 40 MB each, 100 MB total
on the free tier), browse/search them, and download. 

## Stack

- **Backend** — Node + TypeScript, Express, Prisma (Postgres), Zod validation,
  Pino logging, JWT auth. File storage via Supabase Storage using signed URLs.
- **Frontend** — Vite + React + TypeScript, React Query, a thin typed API
  client. The UI is intentionally minimal now; a polished design is plugged in
  later behind the same data layer.
- **Shared** — a `shared/` workspace of Zod schemas/constants imported by both
  sides so request/response shapes never drift.

## Repo layout

```
backend/    Express API, Prisma schema, tests
frontend/   Vite React app
shared/     Zod DTO schemas + constants (npm workspace)
```

## Getting started (local dev)

Prereqs: Node 20+, Docker, and a Supabase project (for file storage).

Each app has its own env file (backend secrets are kept out of the public
frontend bundle):

```bash
cp backend/.env.example backend/.env     # DB + JWT + Supabase secrets
cp frontend/.env.example frontend/.env   # VITE_API_URL only
npm install                   # installs all workspaces
npm run build:shared          # compile the shared package

# Option A — run Postgres in Docker, app on host:
docker compose up -d db
npm run prisma:migrate --workspace backend
npm run dev:backend           # http://localhost:4000
npm run dev:frontend          # http://localhost:5173

# Option B — everything in Docker:
docker compose up --build     # backend + db (frontend stays on host via `npm run dev:frontend`)
```

## Environment

Two env files, one per app: [backend/.env.example](backend/.env.example)
(secrets) and [frontend/.env.example](frontend/.env.example) (public).

**Backend** — `DATABASE_URL` and `SUPABASE_*` are unrelated: Prisma uses the DB
URL; the Supabase keys are for the Storage API (signed URLs), not the database.

| Var                    | Purpose                                                       |
| ---------------------- | ------------------------------------------------------------ |
| `DATABASE_URL`         | Postgres connection used at runtime (Supabase: pooled, 6543) |
| `DIRECT_URL`           | Direct Postgres connection for `prisma migrate` (5432)       |
| `JWT_SECRET`           | Signs auth tokens                                            |
| `SUPABASE_URL`         | Supabase Storage/API base URL (not the DB)                  |
| `SUPABASE_SERVICE_KEY` | Service-role key — used server-side to sign storage URLs    |
| `SUPABASE_BUCKET`      | Storage bucket name (default `files`)                       |
| `CORS_ORIGIN`          | Allowed frontend origin                                      |

**Email / SMTP** — used to send the signup/reset OTP emails. All optional: leave
`SMTP_HOST` blank in development and the mailer logs the OTP to the console
instead of sending it, so the flow is testable without an SMTP server. Set all of
these in production (e.g. as Cloud Run secrets).

| Var                  | Purpose                                                            |
| -------------------- | ----------------------------------------------------------------- |
| `SMTP_HOST`          | SMTP server host (blank → dev mode: OTP printed to the console)   |
| `SMTP_PORT`          | SMTP port (default `587`)                                          |
| `SMTP_SECURE`        | `true` for TLS on connect (port 465), else `false` (default)      |
| `SMTP_USER`          | SMTP username / login                                              |
| `SMTP_PASS`          | SMTP password or app/API key                                      |
| `SMTP_FROM`          | From header, e.g. `Pocket Locker <no-reply@pocketlocker.app>`      |
| `OTP_EXPIRY_MINUTES` | How long an emailed OTP stays valid (default `10`)                 |

**Frontend** — `VITE_API_URL` only (anything Vite reads is shipped to the browser,
so no secrets here).

## Testing

```bash
npm test            # backend (vitest + supertest) and frontend (vitest)
npm run typecheck   # type-check every workspace
```

Backend integration tests stub Prisma and the mailer in-memory, so they need no
database. For manual/e2e checks the app runs against the Supabase DB directly
(no local Docker needed) — see the local-dev steps above.

## Deploy (Cloud Run)

The root [`Dockerfile`](Dockerfile) builds the backend image and is picked up
automatically by Cloud Build:

```bash
gcloud run deploy pocket-locker-api --source . --region <region>
```

The server listens on `process.env.PORT` (Cloud Run injects `8080`) and binds
`0.0.0.0`. Set the backend env vars (`DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`,
`SUPABASE_*`, `SMTP_*`, `CORS_ORIGIN`) as Cloud Run service variables/secrets.
Run `prisma migrate deploy` as a separate step (not on container start) so
instances don't race. The frontend deploys to Vercel with `VITE_API_URL` set to
the Cloud Run URL.

## Notable decisions & tradeoffs

- **Signed-URL uploads** — files go directly from browser to Supabase Storage,
  so the backend never proxies large payloads. This gives real upload progress
  and sidesteps request-size limits. Quota is checked before issuing the URL and
  re-verified on confirm.
- **Keyset pagination** — list endpoints page by cursor, not offset, for stable
  results and index-friendly queries.
- **In-memory rate limiting** — simple and dependency-free, but only correct on
  a single instance. A shared store (e.g. Redis) would be needed across multiple
  instances. Documented rather than hidden.

## Roadmap

Build order, one PR each: scaffolding → auth → upload → list/view → download →
usage/upgrade. Deferred: forgot-password, OAuth, CDN, cloud deploy config.
