# 03 — Migration Plan (Strangler Fig)

**Approach:** run Next.js and Django against the **same database** while routes move one group at a time behind `/api/*`. A catch-all route proxies anything not yet ported to Django, so the UI never sees a half-migrated API. Django is switched off only when the proxy receives no traffic.

Sizing uses T-shirt sizes (S ~ 1-2 days, M ~ 3-5 days, L ~ 1-2 weeks) for a single developer familiar with both codebases.

---

## Phase 0 — Foundations (S)

**Goal:** the Next app can talk to the database and has the scaffolding every later phase needs. No user-visible change.

Tasks
1. Add dependencies: `drizzle-orm`, `drizzle-kit`, `pg`, `jose`, `zod`, `server-only`, `openai`, `twilio`; dev: `vitest`, `@vitest/coverage-v8`, `tsx`.
2. Local Postgres: reuse `backend_booking/docker-compose.yml`'s `db` service (or add a minimal `docker-compose.yml` here with Postgres only). Point `DATABASE_URL` at it.
3. `drizzle.config.ts` + `yarn db:pull` to introspect the Django schema into `src/server/db/schema.ts`; commit the result. Add `src/server/db/client.ts`.
4. `src/server/env.ts` (zod-validated env), `src/server/http/{errors,respond}.ts`, `src/app/api/health/route.ts`.
5. Strangler proxy `src/app/api/[...path]/route.ts`: forwards method, body, query and the `Cookie` header to `LEGACY_API_URL`, and passes `Set-Cookie` back. Logs each proxied path (this log is the decommission signal in Phase 5).
6. Vitest config, first unit test, GitHub Actions workflow (lint, `tsc --noEmit`, test).
7. Update `CLAUDE.md` with the new commands (`db:pull`, `db:migrate`, `db:seed`, `test`).

Exit criteria
- `yarn dev` boots with `NEXT_PUBLIC_API_URL=/api/` and every existing screen works **through the proxy** with Django still serving.
- `GET /api/health` returns 200 with a DB round-trip.

## Phase 1 — Authentication (M)

**Goal:** login, logout, refresh and the server-side session are native; Django-issued cookies stay valid.

Tasks
1. `server/auth/password.ts`: parse/verify Django PBKDF2-SHA256; hash in the same format. Unit-test against hashes exported from the Django DB.
2. `server/auth/jwt.ts`: HS256 sign/verify with `AUTH_SECRET = DJANGO_SECRET_KEY`, SimpleJWT claim layout. Test: a token minted by Django verifies here and vice versa.
3. `server/auth/cookies.ts`, `server/auth/session.ts` (`getSession`, `requireSession`).
4. Routes: `POST /api/auth/login` (returns `{ user }`, sets cookies), `POST /api/auth/logout`, `POST /api/auth/refresh`. Keep aliases `POST /api/users/login`, `/api/users/logout`, `/api/token/refresh` for the untouched client code, or update `userApiClient.ts` and `DashboardNavBar.tsx` in the same PR (preferred).
5. Replace `src/api/userApi.ts` usage in `app/layout.tsx`, `(protected)/layout.tsx`, `login/page.tsx` with `getSession()`. Remove `jsonwebtoken`.
6. `middleware.ts`: when access token is expired and refresh is valid, rotate cookies on the response (fixes D7).
7. `GET/PATCH /api/users/:id` with the self-or-owner rule; keep `{ user }` wrapper on GET.

Exit criteria
- Log in via Next, reload: session restored without any call to Django.
- A browser logged in through Django before the deploy stays logged in after it.
- Proxy log shows no `users/*` or `token/*` traffic.

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
- Proxy log shows only `voice/*` traffic.

**Dual-run caution:** during this phase, appointments created via Next will not have a Dramatiq reminder scheduled, and ones created via Django will. Keep the Django worker running until Phase 4 completes so legacy reminders still fire; Phase 4 handles the hand-over.

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
- Voice flow: record -> transcribe -> chat -> booking appears on the calendar, with Django stopped.
- Proxy log is empty for 48 h of normal use.

## Phase 4 — Reminders without a queue (S-M)

**Goal:** reminder SMS are driven by the cron sweep; Dramatiq/Redis can be turned off.

Tasks
1. Drizzle migration: add `reminder_sent_at`, `confirmation_sent_at`, indexes from `02 §4.2`.
2. `server/sms/reminders.ts`: select due, unsent, future appointments joined with salon `reminder_time_minutes`; send; stamp `reminder_sent_at`. Idempotent and safe to run concurrently (use `UPDATE ... WHERE reminder_sent_at IS NULL RETURNING` to claim rows before sending).
3. `GET /api/jobs/reminders` protected by `CRON_SECRET`. Configure Vercel Cron (`*/5 * * * *`) or node-cron.
4. Appointment service: on time change set `reminder_sent_at = NULL`.
5. **Hand-over script** run once at switch time: for appointments whose reminder time is already in the past, set `reminder_sent_at = now()` so the sweep does not double-send what Dramatiq already sent; then stop the worker. Any appointment whose reminder is still in the future is handled by the sweep from then on, and its pending Dramatiq message dies with the worker.

Exit criteria
- Test appointment 20 min ahead with a 15-min reminder receives exactly one reminder SMS.
- Worker and Redis stopped; no errors in the Next logs for 24 h.

## Phase 5 — Cutover and decommission (S)

1. Delete `src/app/api/[...path]/route.ts`, `LEGACY_API_URL`, and `NEXT_PUBLIC_API_URL` (hard-code `/api/` in `src/api/*`).
2. Rotate `AUTH_SECRET` (forces one re-login) once Django no longer needs to verify tokens.
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
| Payload drift breaks UI mid-migration | Medium | High | Contract snapshot tests recorded from Django; proxy fallback per route group |
| Timezone regression (UTC wall-clock convention) | Medium | High | Store/compare in UTC only; snapshot tests include day-boundary appointments; see finding D6 |
| Password/JWT incompatibility locks users out | Low | High | Phase 1 fixture tests against real Django hashes/tokens; keep Django login reachable until Phase 5 |
| Duplicate or missed reminder SMS at hand-over | Medium | Medium | Hand-over script in Phase 4; idempotent claim-then-send; alert on sweep errors |
| LLM/Whisper latency exceeds serverless limits | Low | Medium | Node runtime, `maxDuration = 60`; streaming not required for short replies |
| Connection exhaustion on serverless Postgres | Medium | Medium | Pooler (Neon/PgBouncer) or single long-lived container |
| Hidden consumers of the Django API (admin, scripts) | Low | Medium | Proxy access log + Django access log review before Phase 5 |
| Salon address create path already broken (D1) | Medium | Low | Fix in Phase 2 service; confirm expected behaviour with owner |

## Rollback

- Phases 1-3 are reversible by redeploying the Next app with the relevant route group deleted; the strangler proxy immediately resumes forwarding to Django, which is still running against the same data.
- Phase 4 rollback: restart the worker; set `reminder_sent_at = NULL` where it was stamped after the switch time and re-save those appointments via Django to reschedule.
- Phase 5 is the only non-trivial rollback (requires redeploying Django and restoring dropped tables from the `pg_dump`); hence the 48 h silent-proxy and 24 h clean-log gates before it.

## Definition of done

- `backend_booking` is archived; production runs one Next.js deployable plus Postgres and third-party APIs (Twilio, OpenAI).
- All `/api/*` routes require a session and enforce salon scoping (F1-F4 closed).
- Confirmation, reminder and cancellation SMS behave as before.
- CI runs lint, typecheck, unit and integration tests on every PR.
