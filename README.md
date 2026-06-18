# Pocket Locker

A small file-storage SaaS: sign up, upload files (up to 40 MB each, 100 MB total
on the free tier), browse/search them, and download. Built as a take-home
project with an emphasis on clean, readable code and clear structure.

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

```bash
cp .env.example .env          # fill in SUPABASE_* values
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

See [.env.example](.env.example). Key values:

| Var                    | Purpose                                            |
| ---------------------- | -------------------------------------------------- |
| `DATABASE_URL`         | Postgres connection (local Docker or Supabase)     |
| `JWT_SECRET`           | Signs auth tokens                                  |
| `SUPABASE_URL`         | Supabase project URL                               |
| `SUPABASE_SERVICE_KEY` | Service-role key — used server-side to sign URLs   |
| `SUPABASE_BUCKET`      | Storage bucket name (default `files`)              |
| `CORS_ORIGIN`          | Allowed frontend origin                            |

## Testing

```bash
npm test            # backend (vitest + supertest) and frontend (vitest)
npm run typecheck   # type-check every workspace
```

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
