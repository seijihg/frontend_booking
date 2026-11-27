# Design: Single-Application Architecture

Design package for removing the separate Django backend and running the booking system as one Next.js application.

| Document | Contents |
|---|---|
| [01-current-state-findings.md](./01-current-state-findings.md) | Inventory of both repos: endpoints the UI depends on, data model, hidden side effects (SMS), voice flow, auth mechanics, infrastructure, and findings (security gaps F1-F4, defects D1-D7) |
| [02-target-architecture.md](./02-target-architecture.md) | Target design: module layout, Drizzle on the existing Postgres schema, SimpleJWT-compatible cookie auth, tenancy rules, HTTP contract, queue-less SMS/reminders, provider-agnostic voice assistant, config, deployment, testing, decision log, open questions |
| [03-migration-plan.md](./03-migration-plan.md) | Six-phase plan with tasks, exit criteria, risk register, rollback and definition of done (revised 2026-11-27: Django is already off, no strangler proxy) |

**Headline decisions**

1. Keep the REST contract under `/api/*` so the existing `src/api -> hooks -> components` layers survive unchanged.
2. Adopt the current Postgres database and schema in place (no ETL). The Django API is already switched off, so there is no dual-run; Phases 1-2 restore the app.
3. Replace Redis + Dramatiq with inline SMS via `after()` and a 5-minute idempotent reminder sweep.
4. Fix, not port, the unauthenticated and unscoped CRUD endpoints.
5. Voice chat stays on OpenAI for the port; a Claude provider is an optional follow-up behind one interface.

**Open decisions needing the owner's input** are listed in `02-target-architecture.md` section 13.
