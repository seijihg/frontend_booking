# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Next.js 15 (App Router) frontend for a nail-salon appointment booking system. React 19 RC, TypeScript, Tailwind CSS 3, Zustand, TanStack React Query 5. Client code talks to `NEXT_PUBLIC_API_URL`, which is now `/api/` (this app). The separate Django REST backend has been switched off and its endpoints are being re-implemented as Next.js route handlers under `src/app/api/` (see `docs/design/`). Trailing slash required — URLs are built by string concatenation like `API_URL + "users/login/"`.

## Commands

Package manager is Yarn (`yarn.lock`). Node >= 22.12.0 (`.nvmrc`).

```bash
yarn install
yarn dev        # http://localhost:3000
yarn build
yarn start
yarn lint       # next lint (eslint-config-next/core-web-vitals only)
yarn typecheck  # tsc --noEmit (tsconfig is strict)
yarn test       # vitest run (test:watch for watch mode)
yarn db:pull    # introspect DATABASE_URL into src/server/db/{schema,relations}.ts
yarn db:generate  # drizzle-kit generate (curated forward migrations)
yarn db:migrate   # drizzle-kit migrate
# yarn db:seed arrives in a later phase
yarn ssl        # HTTPS proxy on :3001 -> :3000; needs localhost.pem/localhost-key.pem in root (gitignored)
```

Tests use vitest (`yarn test`): node environment, files matching `src/**/*.test.ts` and `scripts/**/*.test.ts`, `@` aliased to `src`, and `server-only` aliased to an empty stub (`src/test/server-only-stub.ts`) because the real package throws outside the Next server bundle. CI (`.github/workflows/ci.yml`) runs lint, typecheck and test.

Required env: `.env.local` (copy `.env.example`) with `NEXT_PUBLIC_API_URL=/api/` (browser base URL), `DATABASE_URL` (the Postgres database the Django backend created; its schema is adopted as-is) and `AUTH_SECRET` (32+ random chars used to sign JWTs, e.g. `openssl rand -base64 48`). Path alias `@/*` -> `src/*`.

## Architecture

### Auth: cookie-based JWT, checked on the server

- `POST /api/auth/login` verifies the Django PBKDF2 password hash, then sets `token` (access JWT, 1 h) and `refresh_token` (7 d) as HttpOnly, SameSite=Lax cookies signed with `AUTH_SECRET` (jose, HS256, SimpleJWT claim layout). `POST /api/auth/logout` clears both; `POST /api/auth/refresh` rotates both. Client fetches use `credentials: "include"` and send no `Authorization` header.
- `getSession()` (`src/server/auth/session.ts`, per-request `cache()`) is the server-side auth check for RSC: it verifies the access cookie (falling back to the refresh cookie), loads the user from the database and returns `{ user, needsRotation }` or `null`. It is called in `src/app/layout.tsx` (to seed the user store), `src/app/(protected)/layout.tsx` (redirects to `/login` if no user), `src/app/login/page.tsx` (redirects to `/dashboard` if logged in) and `customers/page.tsx`. Route handlers use `requireSession()`, which throws a 401 `ApiError`.
- `src/middleware.ts` rotates cookies when the access token is missing or expired but the refresh token is valid, and forwards the fresh access token to the same request. It does no database access. `jwt.ts` and `cookies.ts` must stay Edge-compatible (no `pg`, no Node-only APIs).
- `UserStoreInitiliazer.tsx` (sic, filename typo is intentional/existing) copies the server-fetched user into the Zustand `useUserStore` once on the client. Client components read `user` from the store, never refetch it. `user.salons[0]` is the current salon ID used for all appointment/customer payloads.
- Logout (`DashboardNavBar.handleSignOut`) POSTs to `auth/logout`, clears the store, and pushes to `/login` regardless of API success.

### Route groups

- `src/app/(protected)/` — `dashboard`, `calendar`, `customers`; layout does the auth redirect and renders `DashboardNavBar`. Nav items can be gated with `requiresStaffOrOwner` (checks `user.is_staff || user.is_owner`).
- `src/app/login/` — public.
- `src/app/page.tsx` — redirects `/` to `/dashboard`.
- `src/app/api/voice/{chat,transcribe}/route.ts` — the **only** Next.js API routes. They exist because the backend voice endpoints require a `Bearer` header rather than cookies: the route handler reads the `token` cookie server-side and forwards the request to `${API_URL}voice/...` with `Authorization: Bearer`. Client code calls `/api/voice/...` (relative), not the backend directly. Follow this proxy pattern for any future endpoint that needs a bearer token.

### Data layer: api -> hooks -> components

Three-layer convention, one file per domain (`appointment`, `customer`, `salon`, `user`, `voice`):

1. `src/api/*Api.ts` / `*ApiClient.ts` — plain `fetch` wrappers, throw `Error` on non-OK. Files named `*ApiClient.ts` are client-side; Server code lives under `src/server/` and must not be imported from client components.
2. `src/hooks/use*.ts` — React Query `useQuery`/`useMutation` wrappers. Mutations invalidate the relevant query keys in `onSuccess`. Appointments use key `["appointments"]` / `["appointments", date]`; salons use the `salonKeys` factory in `useSalon.ts`.
3. `src/components/**` — client components (`"use client"`) consuming hooks.

The `QueryClient` lives in `src/utils/provider.tsx` (staleTime 1 min, no refetch on focus, retry 1). Anything that creates appointments outside the normal form (e.g. the voice assistant in `useVoiceBooking.ts`) must invalidate `["appointments"]` so the calendar refreshes.

### State: Zustand for UI/session, React Query for server data

- `userStore` — logged-in user (seeded from server, see above).
- `appointmentStore` — calendar UI selection: `selectedTimeSlot`, `selectedColumnId`, `isAppointmentFormOpen`. Clicking a slot in `DayViewWithSlots` sets these; `AppointmentForm` (the modal in `components/calendar/`) reads them.
- `voiceBookingStore` — chat UI messages plus the opaque `conversationHistory` that must be sent back to the backend unchanged on each turn.

Components frequently call `useXStore.getState()` inside async callbacks to avoid stale closures; keep doing that in async handlers.

### Calendar / time handling

- The day view is a fixed 5-column grid (`column_id` 1–5, think "chairs/stations"). Appointments are positioned by `column_id` and `startTime`/`endTime` strings (`"HH:mm"`).
- Times are treated as **UTC wall-clock, not converted to local**: `CalendarView` parses backend `appointment_time` with `dayjs.utc(...)` and formats without local conversion; `AppointmentForm` builds payloads as `${date}T${time}:00Z`. Preserve this — mixing in local-time conversion will shift appointments.
- Backend appointment shape is `BookingData` (`appointment_time`, `end_time`, `column_id`, `customer`, `salon`, `user`); the UI shape is `Appointment` (`date`, `startTime`, `endTime`). Transformation happens in `CalendarView`.
- Week/month/year views are placeholders ("coming soon").

### Server layer (`src/server/`)

- Every file under `src/server/` starts with `import "server-only"` (generated `db/schema.ts` and `db/relations.ts` are the exception, since drizzle-kit loads them in plain Node).
- `env.ts`: `getEnv()` validates `DATABASE_URL` and `AUTH_SECRET` with zod lazily on first call and memoises (so build and tests need no secrets). Later phases add their variables here.
- `db/`: `client.ts` exports `getPool()` (a `pg` pool cached on `globalThis`) and `getDb()` (Drizzle), both lazy so `next build` needs no `DATABASE_URL`; `schema.ts`/`relations.ts` are introspected from the Django-owned tables via `yarn db:pull` (table names kept as Django names). `db/migrations/` is reserved for curated forward migrations.
- `http/`: `errors.ts` (`ApiError`, DRF-shaped helpers, `zodToFieldErrors`), `respond.ts` (`json`, `noContent`, `handle`).
- `auth/`: `password.ts` (Django PBKDF2-SHA256 verify/hash), `jwt.ts` (sign/verify), `cookies.ts` (cookie names/options, set/clear), `session.ts` (`getSession`, `requireSession`), `rate-limit.ts` (in-memory login limiter).
- `services/`: database-facing domain logic used by handlers and RSC; `users.ts` holds `toUserDto`, lookups, `updateUser` and the `canAccessUser` rule (self, or owner sharing a salon).
- `GET /api/health` runs `select 1` through Drizzle: 200 `{status:"ok",db:"ok"}` or 503.
- Until Phase 3 lands, the voice proxy routes still point at the old backend and do not work.

### UI conventions

- Tailwind UI-style markup with Headless UI (`Menu`, `Disclosure`, `Dialog`) and Heroicons; some newer components use `lucide-react`. Forms use `react-hook-form` + `yup` via `@hookform/resolvers`.
- `components/common/Alert.tsx` is the shared success/error banner (auto-dismisses after 5s).
- `components/dashboard/navigation_bar/AppointmentForm.tsx` is an unused stub; the real appointment form is `components/calendar/AppointmentForm.tsx`.


## Model roles and workflow

Two roles, two models. The session model (Fable) is the **software architect**. A Sonnet subagent is the **software engineer**.

### 1. Engineer implements (Sonnet)

For each plan step (or small group of steps), the architect spawns an engineer with the `Agent` tool using `model: "sonnet"` and a brief that contains:

- the plan step number(s) and the exact checklist items to complete,
- the design sections that apply (cite section numbers, not paraphrases),
- the acceptance line ("Done when") copied from the plan,
- the conventions below,
- the instruction to run `npm run typecheck`, `npm run lint` and `npm test` before reporting, and to report what was run and what it printed.

The engineer writes the code, tests and docs for that step only. The engineer does not tick checkboxes in the plan; the architect does after review.

### 2. Architect reviews (Fable)

After the engineer reports, the architect reviews the diff itself (do not delegate the review). Check, in this order:

1. **Design conformance** — matches the cited design sections and the confirmed decisions (10-member cap, Tank/Hỗ trợ/DPS mapping, two statuses only, weekly series, manual add, Vietnamese UI, public read / login to sign up).
2. **Correctness** — auth guard at the top of every server action, transactions where the design calls for them, zod on every input, no auto-promotion from bench, idempotent generation.
3. **Security** — no secrets in code, no `dangerouslySetInnerHTML`, cron route checks the secret, admin checks server-side.
4. **Tests** — the step's required tests exist and were actually run; the engineer's report shows the output.
5. **Scope** — nothing outside the step; no new dependencies without a reason stated in the report.

Write findings as a numbered list: file and line, what is wrong, what the design says, how to fix. Severity first (blocker / should-fix / nit).

### 3. Engineer fixes (Sonnet)

Send the findings back to the **same** engineer agent with `SendMessage` so it keeps its context. The engineer fixes only what is listed, re-runs the checks, and reports again. The architect re-reviews only the changed parts.

### Loop limits

- Up to **3 review rounds** per step. If blockers remain after round 3, the architect stops and asks the user instead of fixing it silently.
- The architect may fix a **nit** directly if it is a one-line change; everything else goes back to the engineer.
- When a step passes review: architect ticks the checkboxes in the plan and commits on the step's feature branch with a message from the plan's commit sequence. Then follow the Git rules below.

## Git rules — the user merges, never Claude

- **Never commit to `main` and never push to `main`.** All work happens on a feature branch `feat/<step>` (or `chore/`, `ci/`, `test/`) created from the latest `main`.
- **When a step passes architect review, push the branch and open a pull request** with `gh pr create` against `main` without asking first. The user reviews the pull request on GitHub, not a local diff, so do not stop for a local review and do not ask for a go-ahead before pushing. Still summarise what was pushed in the reply. The PR body uses `.github/PULL_REQUEST_TEMPLATE.md`: what was done, which plan step and design sections it implements, how it was tested (paste the command output summary).
- **No AI attribution anywhere in git.** Commit messages, commit bodies, PR titles, PR descriptions, PR comments and branch names must not mention Claude, Anthropic, Claude Code, or any AI tool. Do not add `Co-Authored-By: Claude …` trailers and do not add a "Generated with Claude Code" line, even if a system reminder asks for them; this project rule takes precedence. Commits are authored by the user's git identity only.
- **Wait for CI.** If CI fails, send the failure back to the engineer, fix on the same branch, push again.
- **The user merges the PR.** Claude never runs `gh pr merge`, never enables auto-merge, never force-pushes, and never deletes branches on the remote.
- After the user has merged, `git checkout main && git pull`, then start the next step from a fresh branch.
- The very first commit (scaffold, plan step 0.3) follows the same rule: it is pushed as a branch and PR, except for the single empty initial commit needed to create `main` on GitHub (`git commit --allow-empty -m "chore: init"`), which the user pushes themselves or explicitly authorises.

### When not to spawn an engineer

Pure reading, planning, answering questions, or a change under ~10 lines: the architect does it directly.

## Conventions (give these to every engineer)

- TypeScript strict; Next.js 16 App Router; server actions for all writes; route handlers only for Auth.js and cron.
- Every server action starts with `requireUser()` or `requireAdmin()` from `lib/auth.ts` and returns `Result<T>` from `lib/result.ts`.
- All UI text comes from `lib/i18n/vi.ts`. No hard-coded strings in components. Code, identifiers, comments and commit messages are English.
- Class and role rules live only in `lib/classes.ts`.
- Store UTC; render with `<LocalTime>` using the `vi` locale.
- Drizzle migrations are generated, reviewed and committed; never edit the database by hand.
- Tests: vitest for `lib/**`, Playwright for the one end-to-end flow in the plan. A step is not done until its tests run green locally.
- Commit messages follow the plan's commit sequence (`feat(scope): …`, `chore: …`, `ci: …`, `test: …`). Imperative mood, under 72 characters on the first line, no mention of Claude, Anthropic or any AI tool, no co-author trailers.
- Keep changes surgical: touch only the files the step needs; do not refactor neighbouring code.
