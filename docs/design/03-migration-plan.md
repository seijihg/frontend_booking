# 03 — Migration Plan

**Approach (revised 2026-11-27):** the Django API has already been **switched off**, so there is no dual-run and no strangler proxy. Next.js adopts the existing Postgres database and re-implements the `/api/*` contract one route group at a time. The application is unusable for end users until Phase 1 (login) ships and only fully usable after Phase 2, so Phases 1 and 2 are the critical path. The original strangler-fig variant (catch-all proxy to Django, `LEGACY_API_URL`) was dropped before it shipped.

Sizing uses T-shirt sizes (S ~ 1-2 days, M ~ 3-5 days, L ~ 1-2 weeks) for a single developer familiar with both codebases.

---

## Phase 0 — Foundations (S)

**Goal:** the Next app can talk to the database and has the scaffolding every later phase needs. No user-visible change.

Tasks
1. Add dependencies: `drizzle-orm`, `drizzle-kit`, `pg`, `jose`, `zod`, `server-only`, `openai`, `twilio`; dev: `vitest`, `@vitest/coverage-v8`, `tsx`.
2. Local Postgres: reuse `backend_booking/docker-compose.yml`'s `db` service (or add a minimal `docker-compose.yml` here with Postgres only). Point `DATABASE_URL` at it.
3. `drizzle.config.ts` + `yarn db:pull` to introspect the Django schema into `src/server/db/schema.ts`; commit the result. Add `src/server/db/client.ts`.
4. `src/server/env.ts` (zod-validated env), `src/server/http/{errors,respond}.ts`, `src/app/api/health/route.ts`.
5. ~~Strangler proxy~~ — dropped; Django is already off (see Approach).
6. Vitest config, first unit test, GitHub Actions workflow (lint, `tsc --noEmit`, test).
7. Update `CLAUDE.md` with the new commands (`db:pull`, `db:migrate`, `db:seed`, `test`).

Exit criteria
- `yarn dev` boots with `NEXT_PUBLIC_API_URL=/api/`; `yarn lint`, `yarn typecheck`, `yarn test` pass locally and in CI.
- `GET /api/health` returns 200 with a DB round-trip.

## Phase 1 — Authentication (M)

**Goal:** login, logout, refresh and the server-side session are native. Existing users keep their passwords (Django PBKDF2 hashes are verified as-is); existing Django-issued cookies are simply invalid and users log in again once.

Tasks
1. `server/auth/password.ts`: parse/verify Django PBKDF2-SHA256; hash new passwords in the same format. Unit-test against hashes exported from the Django DB.
2. `server/auth/jwt.ts`: HS256 sign/verify with a **fresh** `AUTH_SECRET`, SimpleJWT claim layout kept (`token_type`, `user_id`, `jti`, `iat`, `exp`) so the client-side token helpers keep working. No cross-compatibility with Django tokens is required.
3. `server/auth/cookies.ts`, `server/auth/session.ts` (`getSession`, `requireSession`).
4. Routes: `POST /api/auth/login` (returns `{ user }`, sets cookies), `POST /api/auth/logout`, `POST /api/auth/refresh`. Keep aliases `POST /api/users/login`, `/api/users/logout`, `/api/token/refresh` for the untouched client code, or update `userApiClient.ts` and `DashboardNavBar.tsx` in the same PR (preferred).
5. Replace `src/api/userApi.ts` usage in `app/layout.tsx`, `(protected)/layout.tsx`, `login/page.tsx` with `getSession()`. Remove `jsonwebtoken`.
6. `middleware.ts`: when access token is expired and refresh is valid, rotate cookies on the response (fixes D7).
7. `GET/PATCH /api/users/:id` with the self-or-owner rule; keep `{ user }` wrapper on GET.

Exit criteria
- Log in via Next with an existing (Django-created) account, reload: session restored from the DB.
- Logout clears both cookies; an expired access token with a valid refresh token is rotated transparently.
- No remaining imports of `src/api/userApi.ts` or `jsonwebtoken`.

## Phase 2 — Core CRUD + tenancy + SMS side effects (M-L)

**Goal:** salons, customers, appointments are served natively with identical payloads, scoped to the caller's salons, with confirmation/cancellation SMS preserved.

Tasks
1. zod schemas in `src/lib/validation/` for salon, address, customer, appointment (port every DRF validator incl. UK postcode regex, past-time rejection, non-empty `salon_ids`).
2. Services: `salons.ts` (fixes D1: addresses are created without a `salon` kwarg, M2M rows inserted), `customers.ts` (filter + allow-listed sort), `appointments.ts` (`?date` on UTC date; create/update/delete with side effects).
3. `server/sms/`: Twilio client, templates ported from `tasks.py`, `after()` hooks for confirmation on create / time change and cancellation on delete. No reminders yet.
4. Route handlers for all nine CRUD endpoints. Response parity verified by **contract snapshot tests**: record Django responses for a seeded dataset, assert the Next handlers return deep-equal JSON (ignoring `modified` timestamps).
5. Authorization rules from `02 §5.2`. Add integration tests proving a user cannot read another salon's data.
6. Remove `credentials: "include"` reliance checks; nothing changes client-side because the URL base is already `/api/`.

Exit criteria
- Full manual pass: day view, create/edit/delete appointment, customer list/edit/delete, dashboard salon settings and profile edit.
- Confirmation and cancellation SMS received on a test number.
- The app is usable end to end again for everything except voice booking.

**Reminder gap:** the Dramatiq worker is off with the rest of Django, so no reminder SMS are sent between now and the end of Phase 4. Phase 4 closes the gap; keep it short.

## Phase 3 — Voice booking (M)

**Goal:** `/api/voice/transcribe` and `/api/voice/chat` become real handlers.

Tasks
1. `server/voice/transcribe.ts` with the `openai` SDK; enforce 10 MB and MIME allow-list; `maxDuration = 60`.
2. `server/voice/tools.ts` (zod -> JSON Schema), `prompts.ts` (verbatim port, date injected as UTC), `executor.ts` on top of Phase 2 services, `assistant.ts` loop with 5-round cap, `providers/openai.ts`.
3. Route handlers return `{ reply, conversation_history, appointments? }` exactly as today; `useSendChatMessage` already invalidates the appointments query when `appointments` is present.
4. Unit tests for executor (ported from `test_tool_executor.py`), loop tests with a fake provider.
5. Delete the two old proxy routes' Bearer-forwarding code (they are now the implementation).
6. Optional stub `providers/anthropic.ts` behind `VOICE_PROVIDER` (not wired to production).

Exit criteria
- Voice flow: record -> transcribe -> chat -> booking appears on the calendar.
- No code path references the old backend any more.

## Phase 4 — Reminders without a queue (S-M)

**Goal:** reminder SMS are driven by the cron sweep; Dramatiq/Redis can be turned off.

Tasks
1. Drizzle migration: add `reminder_sent_at`, `confirmation_sent_at`, indexes from `02 §4.2`.
2. `server/sms/reminders.ts`: select due, unsent, future appointments joined with salon `reminder_time_minutes`; send; stamp `reminder_sent_at`. Idempotent and safe to run concurrently (use `UPDATE ... WHERE reminder_sent_at IS NULL RETURNING` to claim rows before sending).
3. `GET /api/jobs/reminders` protected by `CRON_SECRET`. Configure Vercel Cron (`*/5 * * * *`) or node-cron.
4. Appointment service: on time change set `reminder_sent_at = NULL`.
5. **Backfill** run once with the migration: set `reminder_sent_at = now()` for every appointment whose reminder time is already in the past, so the first sweep does not send stale reminders for appointments that are about to start or already happened. Appointments whose reminder time is still in the future are picked up by the sweep normally.

Exit criteria
- Test appointment 20 min ahead with a 15-min reminder receives exactly one reminder SMS.
- No errors in the Next logs for 24 h.

## Phase 5 — Cutover and decommission (S)

1. Delete `NEXT_PUBLIC_API_URL` (hard-code `/api/` in `src/api/*`).
2. ~~Rotate `AUTH_SECRET`~~ — not needed; Phase 1 already uses a fresh secret.
3. Shut down gunicorn/ECS service, Redis, and the backend CI. Archive `backend_booking` with a README pointer to this repo. Remove CORS/CSRF origins and the `.lichnails.co.uk` cookie domain from DNS/infra notes.
4. Drizzle migration: drop `task_id`; drop Django-only tables (`django_*`, `auth_*`, `account_*`, `socialaccount_*`, `authtoken_*`, `django_dramatiq_*`). Take a `pg_dump` first.
5. Update `README.md` and `CLAUDE.md`: single-app setup, `docker compose up db`, `yarn db:migrate`, `yarn db:seed`, `yarn dev`.

## Phase 6 — Post-migration improvements (optional, prioritise with the owner)

- Owner-managed staff creation UI + `POST /api/users`.
- Rate limiting on login (Upstash or in-memory token bucket).
- Evaluate Claude as voice provider with a transcript-based eval (see `02 §8.3`).
- Idiomatic table names, camelCase API, or Server Actions for forms, now that the contract is owned end to end.
- Playwright E2E in CI.

---

## Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Payload drift breaks UI mid-migration | Medium | High | Contract tests written from the DRF serializers and the frontend `types/*`; manual pass per route group |
| Timezone regression (UTC wall-clock convention) | Medium | High | Store/compare in UTC only; snapshot tests include day-boundary appointments; see finding D6 |
| Password incompatibility locks users out | Low | High | Phase 1 fixture tests against real Django password hashes; owner can reset passwords via the DB if needed |
| Duplicate or missed reminder SMS when the sweep starts | Medium | Medium | Backfill in Phase 4; idempotent claim-then-send; alert on sweep errors |
| LLM/Whisper latency exceeds serverless limits | Low | Medium | Node runtime, `maxDuration = 60`; streaming not required for short replies |
| Connection exhaustion on serverless Postgres | Medium | Medium | Pooler (Neon/PgBouncer) or single long-lived container |
| Hidden consumers of the Django API (admin, scripts) | Low | Medium | Already off; anything that breaks surfaces now and is triaged with the owner |
| Salon address create path already broken (D1) | Medium | Low | Fix in Phase 2 service; confirm expected behaviour with owner |

## Rollback

- Phases 1-3 are reversible by redeploying the previous Next build; the database is only read and written through the same tables Django used, so no data migration is involved. The fallback of turning Django back on remains possible until Phase 5 drops its tables.
- Phase 4 rollback: disable the cron route; set `reminder_sent_at = NULL` where it was stamped after the switch if reminders must be re-sent.
- Phase 5 is the only non-trivial rollback (requires redeploying Django and restoring dropped tables from the `pg_dump`); hence the 24 h clean-log gate before it.

## Definition of done

- `backend_booking` is archived; production runs one Next.js deployable plus Postgres and third-party APIs (Twilio, OpenAI).
- All `/api/*` routes require a session and enforce salon scoping (F1-F4 closed).
- Confirmation, reminder and cancellation SMS behave as before.
- CI runs lint, typecheck, unit and integration tests on every PR.
