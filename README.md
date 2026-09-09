# SDM Client Portal

A secure client intake, onboarding and support portal for **Saoirse Digital Marketing (SDM)** — built with Next.js (App Router), TypeScript, Prisma and Tailwind CSS.

Clients create an account, complete a structured business + marketing intake, upload supporting documents, track onboarding progress, and raise support tickets. SDM staff review submissions, manage documents, and run support from a separate admin console. The portal is designed to sit **in front of** SDM's CRM/automation stack, not replace it — see [Integrations](#integrations--downstream-sync) below.

## Live deployment

Deployed on Railway (separate from SDM's main website — this is a standalone URL until it's ready to be linked in):

**https://portal-production-23c7.up.railway.app**

The Railway project (`sdm-client-portal`) runs two services: `portal` (this app) and `Postgres`, plus a persistent volume for uploaded documents.

## Quick start (local dev)

```bash
npm install
cp .env.example .env        # then set a real AUTH_SECRET and DATABASE_URL (see below)
npx prisma migrate dev      # applies the schema to your Postgres database
npx prisma db seed          # optional: loads demo clients/admin (see below)
npm run dev                 # http://localhost:3000
```

Local dev needs a Postgres database (a free local one via `docker run -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres` works fine, or point at any hosted instance).

Generate a secret for `.env`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Demo accounts (after `prisma db seed`)

| Role | Email | Password | Notes |
|---|---|---|---|
| SDM Admin | `admin@saoirsedigital.com` | `AdminPass123` | Full admin console |
| SDM Team Member | `team@saoirsedigital.com` | `TeamPass123` | Admin console, ticket assignee |
| Client — just signed up | `owner@brightleafcafe.ie` | `ClientPass123` | Account Created stage |
| Client — mid onboarding | `hello@kilkennyfitco.ie` | `ClientPass123` | Business + intake done, one doc outstanding, has an open ticket |
| Client — fully onboarded | `info@corkcraftbrew.ie` | `ClientPass123` | 100% complete, approved documents |

## Tech stack & key decisions

- **Next.js 14 (App Router) + TypeScript** — server components for data-heavy pages, client components for interactive forms.
- **Prisma + Postgres**. The schema is a plain relational model (see `prisma/schema.prisma`) that maps directly to the Build Brief's table list (`users`, `businesses`, `client_intake`, `documents`, `document_requests`, `support_tickets`, `ticket_messages`, `activity_log`), plus token tables for email verification / password reset.
  - "Enum-like" columns (role, status, category, priority, etc.) are stored as `String` rather than native Postgres `enum`s and validated at the application boundary against the TS union types in `src/lib/enums.ts`. This started as a SQLite-compatibility choice (SQLite has no enum type) and was kept after moving to Postgres so the schema stays portable and migrations stay simple — native `enum` blocks can be reintroduced later if desired, but nothing depends on it.
  - `SupportTicket.ticketNumber` (used for the human-facing `SDM-1042` reference) is assigned by the app (`src/lib/tickets.ts`) rather than a DB `autoincrement()` on a non-primary-key column.
- **Auth** is hand-rolled rather than a library: bcrypt password hashing, `jose`-signed JWT session cookies (httpOnly, 7-day expiry), and single-use hashed tokens for email verification / password reset (`src/lib/tokens.ts`). Route protection is layered: `middleware.ts` does a coarse, Edge-safe redirect based on the JWT's role claim; every Server Component/API route re-verifies against the database via `src/lib/rbac.ts` before touching data. Clients can only ever reach their own business's rows.
- **Email is provider-agnostic** (`src/lib/email.ts`), controlled by `EMAIL_PROVIDER`: `console` (default, logs to stdout — always works, zero setup), `smtp` (nodemailer), or `webhook` (POSTs JSON to `EMAIL_WEBHOOK_URL`, meant for a Make.com scenario or Hostinger automation that owns real delivery from `info@saoirsedigital.com`). Support-ticket creation emails both the client and `SDM_SUPPORT_INBOX`, with the ticket ID in the subject (`[SDM-1042] ...`), per the brief.
- **File storage** is a small abstraction (`src/lib/storage.ts`) that writes to local disk under `UPLOAD_DIR` by default. Swap its implementation for S3/GCS in production; nothing else needs to change since callers only deal with an opaque `storageReference`.
- **Downstream integration hook** (`src/lib/integration.ts`): key events (registration, intake updates, document uploads/reviews, ticket activity, onboarding stage changes) are dispatched as structured JSON to `INTEGRATION_WEBHOOK_URL` — see [CRM integration](#crm-integration-notion--make) below for what's actually connected on the other end. Every event carries client/business/submission ids and a timestamp so the automation layer never has to guess identity or ordering, and the portal never overwrites CRM data — see §15/§9 of the brief. When no webhook is configured this is a no-op; the same events are always recorded in the Activity Log regardless.
- **Onboarding progress** (`src/lib/progress.ts`) is computed, not stored as a manual toggle: Business Information and Marketing Information complete automatically once their required fields are filled; Supporting Documents completes once every *required* `DocumentRequest` is fulfilled; SDM Review and Onboarding Complete can only be set by staff actions (`/api/admin/clients/[businessId]/review` and `/complete`) — a client can never mark these themselves.

## Project structure

```
prisma/schema.prisma        Data model
prisma/seed.ts               Demo data
src/lib/                     Framework-agnostic core: auth, rbac, email, storage,
                              progress calc, integration dispatch, validation (zod)
src/middleware.ts             Edge-safe route protection
src/app/(auth)/...            Login, register, verify email, forgot/reset password
src/app/(portal)/...          Client-facing app: dashboard, business, intake,
                              documents, support, notifications, account
src/app/(admin)/admin/...     SDM staff console: clients, documents review,
                              onboarding controls, ticket management
src/app/api/...                Route handlers backing both of the above
src/components/ui/            Small shared design-system primitives
src/components/portal/        Client-portal specific components
src/components/admin/         Admin-console specific components
```

## Environment variables

See `.env.example` for the full list with inline explanations. The essentials to change before any real deployment:

- `AUTH_SECRET` — long random string, required.
- `APP_URL` — used to build links in emails.
- `DATABASE_URL` — Postgres connection string (`${{Postgres.DATABASE_URL}}` on Railway).
- `EMAIL_PROVIDER` / `SMTP_*` / `EMAIL_WEBHOOK_URL` — wire up real email delivery.
- `SDM_SUPPORT_INBOX` — defaults to `info@saoirsedigital.com`.
- `INTEGRATION_WEBHOOK_URL` — point at the Make.com scenario that syncs into the CRM once one exists.

## Security notes

- Passwords are hashed with bcrypt (cost 12); tokens (email verification, password reset) are single-use, hashed at rest, and time-limited.
- Role-based access control is enforced server-side on every request (see `src/lib/rbac.ts`), not just hidden in the UI — a client hitting another business's API routes gets a 403/404, not their data.
- No third-party credentials (Google, Meta, hosting, ad platforms) are collected anywhere in this app, per the brief — document requests exist for that information instead.
- `npm audit` currently reports advisories against Next.js 14.x's own bundled/internal dependency chain (this app is pinned to `14.2.35`, the latest published patch on the 14.x line at time of writing). Fully clearing these requires migrating to Next 15/16, which changes the async signature of dynamic route params across every API route and page in the app — a deliberate, larger follow-up rather than something to do silently inside this build. Recommended as the next infrastructure task before a production launch.

## CRM integration (Notion + Make)

Phase 6 is wired to SDM's **actual** live Notion CRM ("SDM OS") and Make account — not a placeholder. It deliberately does **not** touch SDM's existing lead-intake automation (`F-01 Lead Intake`, `CRM-01 F-01 → Notion CRM Handoff`, both Google-Sheets-triggered and actively running); this is a new, separate scenario.

**What's built:**
- A new Notion database, **🎫 SDM OS — Support Tickets**, alongside the existing SDM OS databases under "03 — CRM", related to Organisations and Contacts.
- A new Make scenario, **"SDM Client Portal → Notion CRM Sync"**, triggered by a dedicated custom webhook (`INTEGRATION_WEBHOOK_URL`). It has two branches:
  - `client.registered` → creates an Organisation, a Contact, and an Opportunity (stage "New Lead", Source Submission ID = the portal's business ID) in the certified CRM structure.
  - `ticket.created` → creates a row in the new Support Tickets database.
- The portal's event payloads (`src/lib/integration.ts`, dispatched from `register` and `tickets` routes) send pre-formatted values (e.g. category/priority as their exact Notion select-option labels) so the Make scenario can map fields directly without needing to translate enum codes itself.

**What's intentionally out of scope for this pass** (documented rather than silently skipped):
- Updates after registration — completing business info, marketing intake, document uploads/reviews, ticket status changes — stay portal-only for now. They don't yet push updates back to the Organisation/Opportunity/Support Ticket records in Notion. `ClientIntake.crmReference` / `crmSyncedAt` exist in the schema for exactly this future work (matching an existing Notion record before updating it, rather than duplicating).
- The Support Tickets database's Organisation/Contact relation fields are populated by hand for now — the sync doesn't yet look up the matching Notion Organisation to link a new ticket to it.
- No de-duplication search runs before creating Organisation/Contact/Opportunity records (SDM's own `CRM-01` contract does this via a domain/email match). Since each portal registration is already unique in the portal's own database, duplicate risk is low, but it isn't guarded against on the Notion side yet.

**Before turning it on:** the Make scenario was built via the Make API against verified module names and the CRM's real schema, but has **not been run** — open it in the Make dashboard (`SDM Client Portal → Notion CRM Sync`, currently inactive), use "Run once" with a sample payload, confirm the Organisation/Contact/Opportunity/Support Ticket records look right, and only then activate it. Also confirm the Support Tickets database is shared with whichever Notion integration the "Saoirse's Notion Internal connection" in Make uses (Notion → database → `···` → Connections) — new databases aren't automatically visible to an existing integration.

Everything else — authentication, client accounts, the full intake flow with autosave, the document upload centre with SDM review workflow, the support ticket system with email notifications, and the SDM admin console (Phases 1–5) — is implemented end-to-end.

## Public lead intake (`/get-started`)

An unauthenticated lead-capture form for prospects who don't have a portal account yet — the marketing website can link straight to it. No login, no account creation.

- Route: `src/app/get-started/page.tsx`, form component in `src/components/public/LeadIntakeForm.tsx`, shared schema/options in `src/lib/leadIntake.ts`.
- Submissions POST to `src/app/api/public/lead-intake/route.ts`, which validates server-side (mirroring the client-side Zod validation), generates `submission_id` (UUID) and an ISO-8601 `timestamp`, and forwards a flat JSON payload (`form_version: "intake-v1"`) to `LEAD_INTAKE_WEBHOOK_URL`.
- Includes a hidden honeypot field: a bot that fills it gets a fake success with nothing forwarded.
- Not wired into `src/middleware.ts`'s protected-path list, so it's reachable with no session cookie.

**Reuses the same Make webhook as the CRM sync above** (`LEAD_INTAKE_WEBHOOK_URL` defaults to the same URL as `INTEGRATION_WEBHOOK_URL`, i.e. the `SDM Client Portal → Notion CRM Sync` scenario's webhook) — per the brief for this feature, which named that webhook explicitly. Two things to check before relying on it:
- **That scenario is still inactive** (see above) — submissions will queue at the webhook rather than sync to Notion until it's reviewed and turned on.
- **The payload shape is different from the rest of the app.** Every other event goes through `dispatchIntegrationEvent()` (`src/lib/integration.ts`), which wraps a camelCase payload in an envelope (`{eventId, type, formVersion, occurredAt, payload}`). This form instead posts the flat, snake_case shape requested for it directly (`event_type`, `submission_id`, `first_name`, `company_name`, ...), with no `userId`/`businessId` (there's no account). If the existing scenario's Notion-mapping modules expect the envelope shape, they'll need a second branch (or a dedicated scenario) that reads this flat shape before lead submissions will land correctly in Notion — worth confirming in the Make dashboard alongside the "Before turning it on" checklist above.
