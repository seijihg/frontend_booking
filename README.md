# Frontend Booking System

A Next.js 15 (App Router) appointment booking system for a nail salon, built with React 19, TypeScript and Tailwind CSS. It is a single app: the UI, the REST API (route handlers under `src/app/api/`) and the PostgreSQL access (Drizzle) all live in this repository.

## Prerequisites

- Node.js >= 22.12.0 (see `.nvmrc`)
- Yarn
- Docker (for the local Postgres)

## Setup

1. **Install dependencies**
   ```bash
   yarn install
   ```

2. **Start Postgres**
   ```bash
   docker compose up -d db
   ```
   This runs Postgres 15 on host port 5433 (database `booking_db`, user `booking_user`).

3. **Set environment variables**

   Copy `.env.example` to `.env.local` and fill in:
   - `DATABASE_URL` (the default points at the compose database)
   - `AUTH_SECRET` (32+ random chars, e.g. `openssl rand -base64 48`)
   - optional: Twilio (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`), OpenAI (`OPENAI_API_KEY`), `CRON_SECRET`
   - optional: `SEED_*` values used by `yarn db:seed` (salon and owner details; see `scripts/seed.ts`)

4. **Create the schema and seed the owner**
   ```bash
   yarn db:migrate
   yarn db:seed
   ```
   `db:seed` creates the default salon, its address and the owner user, and is safe to run again.

5. **Run the app**
   ```bash
   yarn dev
   ```
   Open `http://localhost:3000`.

## Commands

| Command | Description |
| --- | --- |
| `yarn dev` | Development server on http://localhost:3000 |
| `yarn build` | Production build |
| `yarn start` | Serve the production build |
| `yarn lint` | ESLint (`next lint`) |
| `yarn typecheck` | `tsc --noEmit` |
| `yarn test` | Unit tests (vitest) |
| `yarn db:migrate` | Apply the migrations in `src/server/db/migrations/` |
| `yarn db:seed` | Create the default salon, address and owner (idempotent) |
| `yarn db:pull` | Introspect `DATABASE_URL` into `src/server/db/{schema,relations}.ts` |
| `yarn db:generate` | Generate a Drizzle migration (use `--custom` for hand-written SQL) |
| `yarn ssl` | HTTPS proxy on :3001 to :3000 (needs `localhost.pem` and `localhost-key.pem`) |

## Architecture

The browser talks to this app's own `/api/` route handlers with cookie-based JWT auth; handlers use Drizzle against Postgres. See `docs/design/` for the design and migration plan and `CLAUDE.md` for the code conventions and layer overview.

## Deployment

Deploy on Vercel. Set the same environment variables as in `.env.local` (`DATABASE_URL`, `AUTH_SECRET`, `CRON_SECRET`, and the optional Twilio and OpenAI values). Run `yarn db:migrate` against the production database before deploying. Vercel Schedules calls `/api/jobs/reminders` every 15 minutes with `CRON_SECRET` as the bearer token (a reminder can therefore arrive up to 15 minutes later than the configured offset).

### Neon

With a [Neon](https://neon.com) database, give the app the **pooled** connection string (the host contains `-pooler`) as `DATABASE_URL` and use `sslmode=verify-full` instead of `sslmode=require` to avoid the `pg` security warning. Run migrations and the seed with the **direct** (non-pooled) string, which Neon recommends for DDL:

```bash
DATABASE_URL="postgresql://…@ep-xxx.region.aws.neon.tech/neondb?sslmode=verify-full" yarn db:migrate
DATABASE_URL="postgresql://…@ep-xxx.region.aws.neon.tech/neondb?sslmode=verify-full" yarn db:seed
```

Neon's free plan suspends the compute after 5 minutes idle and allows 100 compute-hours per project per month; the sweep runs every 15 minutes so the compute sleeps between runs; a 5-minute cadence would keep it awake almost continuously and exceed the free allowance.
