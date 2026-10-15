# CarePoint Clinic Appointment System

A complete, responsive appointment booking web application for a single clinic.
Patients can browse services and book appointments as guests; clinic staff get a
protected dashboard to manage appointments, services, availability and settings.

Built with **Next.js 16 (App Router, Turbopack)**, **React 19**, **TypeScript**,
**Tailwind CSS v4**, and **Supabase** (hosted PostgreSQL + Row Level Security).

---

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Data storage & security](#data-storage--security)
- [Getting started](#getting-started)
- [Available scripts](#available-scripts)
- [Demonstration accounts](#demonstration-accounts)
- [Environment variables](#environment-variables)
- [Booking rules and scheduling logic](#booking-rules-and-scheduling-logic)
- [Appointment statuses](#appointment-statuses)
- [Double-booking prevention](#double-booking-prevention)
- [Email notifications](#email-notifications)
- [Project structure](#project-structure)
- [Testing](#testing)
- [Deployment notes](#deployment-notes)

---

## Overview

CarePoint is a **single-clinic** booking platform with two audiences:

- **Patients (public, no account required)** — browse services, check live
  availability, book an appointment, and look up an existing booking using a
  reference number plus the email used to book.
- **Clinic staff (protected)** — sign in to view a dashboard, manage appointments
  (confirm, complete, cancel, reschedule), manage services, edit working hours
  and blocked periods, and change clinic settings.

All data is stored server-side in a relational database and is shared by every
visitor and staff member.

## Features

### Public site

- Marketing home page, services listing, and about page driven by live database
  content (clinic name, tagline, description, contact details).
- Contact form that persists messages submitted by visitors.
- Live availability lookups that respect opening hours, breaks, blocked periods,
  minimum notice, the maximum booking window, and existing bookings.
- Guest booking flow with full server-side validation and a generated booking
  reference (for example `CP-XXXXXXXX`).
- Booking confirmation page and a "find my appointment" lookup (reference +
  email).
- Responsive layout, accessible form controls, and clear success/error states.

### Staff dashboard

- Cookie-based session authentication backed by Postgres RPCs (bcrypt hashes via
  `pgcrypto`).
- Dashboard with today's schedule, upcoming bookings and status statistics.
- Appointment list with search and filters (date, service, status).
- Appointment detail view with confirm / complete / cancel / reschedule actions,
  and status-transition enforcement.
- Calendar view of appointments by day.
- Service management (create, edit, activate/deactivate, pricing, duration).
- Availability management: weekly working hours (with breaks) and one-off blocked
  periods (full-day or time-range).
- Clinic settings: contact details, timezone, slot interval, minimum notice,
  maximum booking window, auto-confirm and cancellation policy.
- Role-aware staff (an `admin` role also exists for demonstration).

## Tech stack

| Area        | Choice                                             |
| ----------- | -------------------------------------------------- |
| Framework   | Next.js 16 (App Router, React Server Components)   |
| UI          | React 19, Tailwind CSS v4                          |
| Language    | TypeScript                                         |
| Database    | Supabase (hosted PostgreSQL), accessed via `@supabase/supabase-js` |
| Auth        | Postgres `pgcrypto` bcrypt hashing + DB session tokens, via RPCs   |
| Validation  | Hand-rolled, dependency-free validators            |
| Email       | Optional, via Resend (only when configured)        |

## Data storage & security

All application data lives in a **hosted Supabase PostgreSQL** project. This is
*not* browser storage — no `localStorage`, `sessionStorage` or `IndexedDB` is
used for application data. Every booking, service, setting and staff action is
persisted server-side and is shared by every visitor.

Why Supabase:

- A managed PostgreSQL database with **Row Level Security (RLS)** and server-side
  functions, so the app can talk to the database directly with a publishable
  (anon) key without exposing secrets.
- The browser/server client only ever holds the **publishable key**. All
  authorization decisions happen in the database.
- Real SQL, transactions and constraints (including a partial unique index) give
  the same guarantees needed for safe double-booking prevention.

The database schema — tables, indexes, RLS policies, functions and seed data —
lives in [`supabase/schema.sql`](supabase/schema.sql). It is idempotent and safe
to run more than once.

### How the app talks to the database

- `lib/supabase.ts` creates a single shared client from the public URL and
  publishable key.
- Table access (`services`, `clinic_settings`, `working_hours`,
  `blocked_periods`, `appointments`, `contact_messages`) uses RLS policies that
  allow the anonymous role, since this is a public booking app.
- `admin_users` and `admin_sessions` have RLS enabled with **no** policies, so
  they are unreachable through the public API. Staff authentication happens
  through `SECURITY DEFINER` functions:
  - `login_admin(email, password)` verifies the bcrypt hash and creates a session
    token (returning only the token and safe admin fields, never the hash).
  - `current_admin(token)` resolves a session token to an admin.
  - `logout_admin(token)` invalidates a session.
  - Password hashes are produced with Postgres `pgcrypto` (`crypt` /
    `gen_salt('bf')`); hashes never leave the database.
- `chat_messages` (AI booking-assistant history, one row per message and linked
  to a patient) also has RLS enabled with **no** policies. It is reached only
  through the `get_chat_history`, `save_chat_message` and `clear_chat_history`
  `SECURITY DEFINER` functions, so history is persisted server-side rather than
  in the browser.

## Getting started

Requirements: **Node.js 20.6+** (for `--env-file`; this project was built and
tested on Node 24) and npm.

1. **Create the database schema.** Open your Supabase project, go to the
   **SQL Editor**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql)
   and run it. This creates every table, index, policy, function and the
   demonstration seed data (it only seeds when the tables are empty).

2. **Configure environment variables.** Create `.env.local` (gitignored) with:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

3. **Install and run:**

   ```bash
   npm install
   npm run dev
   ```

Then open http://localhost:3000.

For a production build:

```bash
npm run build
npm run start
```

> **Windows note:** if a global npm configuration blocks install scripts, run
> `npm install` on its own (it succeeds with a harmless warning about an
> optional native `unrs-resolver` postinstall step).

## Available scripts

| Script              | Description                                                        |
| ------------------- | ------------------------------------------------------------------ |
| `npm run dev`       | Start the development server.                                      |
| `npm run build`     | Create an optimized production build.                              |
| `npm run start`     | Run the production build.                                          |
| `npm run lint`      | Run ESLint.                                                         |
| `npm run typecheck` | Run the TypeScript compiler with no emit.                          |
| `npm run test:flow` | Run the end-to-end flow test against the configured Supabase DB.   |

## Demonstration accounts

These accounts are created when the database is seeded:

| Role  | Email                  | Password    |
| ----- | ---------------------- | ----------- |
| Admin | `admin@carepoint.test` | `Admin123!` |
| Staff | `staff@carepoint.test` | `Staff123!` |

They are also shown on the admin sign-in page. Change or remove them before any
real deployment.

## Environment variables

Configuration is read from `.env.local` (gitignored).

| Variable         | Purpose                                                                   |
| ---------------- | ------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL, e.g. `https://xxxx.supabase.co`.    |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | The project's publishable (anon) key. Safe to expose; security is enforced by RLS. |
| `RESEND_API_KEY` | Resend API key. Email is disabled while unset.                            |
| `EMAIL_FROM`     | From address used for outgoing email, e.g. `CarePoint <no-reply@clinic>` |

## Booking rules and scheduling logic

Availability is computed per service and date in `lib/availability.ts`:

1. The date must not be in the past.
2. The date must be within the **maximum booking window** (`maxBookingDays`).
3. The clinic must be **open** that weekday (per working hours).
4. The date must not be fully **blocked** by a blocked period.
5. Candidate start times are generated from the opening time in steps of the
   **slot interval**, and must finish before closing time.
6. A slot is unavailable if it overlaps the daily **break**, a time-range
   **blocked period**, or an existing active **appointment**.
7. For **today**, slots earlier than the current time plus the **minimum notice**
   are marked "too soon to book".

Bookings are written with the service duration frozen onto the record, so later
price/duration changes never alter existing appointments.

## Appointment statuses

Allowed transitions are enforced centrally in `lib/status.ts`:

| Status        | Meaning                                             | Can move to                         |
| ------------- | --------------------------------------------------- | ----------------------------------- |
| `pending`     | Submitted, awaiting staff confirmation.             | confirmed, rescheduled, cancelled, no_show |
| `confirmed`   | Confirmed and expected to take place.               | completed, rescheduled, cancelled, no_show |
| `rescheduled` | Time was changed to a new slot.                     | confirmed, completed, cancelled, no_show |
| `completed`   | The patient attended; appointment finished.         | — (terminal)                        |
| `no_show`     | The patient did not attend; slot released.          | — (terminal)                        |
| `cancelled`   | Cancelled; the time slot is released.               | — (terminal)                        |

An additional **display-only** phase, `past`, is derived from the clock by
`lib/appointment-phase.ts`. A `pending`, `confirmed` or `rescheduled`
appointment whose end time has passed is shown as "Past"; it can no longer be
cancelled or rescheduled by the patient, and staff can mark it `completed` or
`no_show`. The phase is never stored in the database.

## Double-booking prevention

Two layers protect against overlapping appointments:

1. **Serialized database function** — bookings are created and rescheduled by
   the `book_appointment` and `reschedule_appointment` Postgres functions. Each
   one takes a transaction-scoped advisory lock on the target date
   (`pg_advisory_xact_lock`), re-checks for overlapping active appointments, and
   only then inserts or updates. Two concurrent requests for the same slot are
   therefore serialized and exactly one succeeds.
2. **Database constraint** — a partial unique index (`uniq_active_slot` on
   `(appointment_date, start_time)` limited to
   `pending`/`confirmed`/`rescheduled`/`completed` rows) guarantees at the
   database level that two active appointments can never share a slot.
   Cancelling an appointment releases the slot for rebooking.

## Email notifications

Email delivery is **optional and honest**. When `RESEND_API_KEY` and `EMAIL_FROM`
are configured, booking confirmations and status changes are sent through Resend.
When they are not configured, the app records everything as normal and clearly
reports that email was not sent — it never claims an email was delivered.

## Project structure

```
app/
  (site)/                 Public site (header/footer layout)
    page.tsx              Home
    services/             Services listing
    about/                About the clinic
    contact/              Contact form
    book/                 Booking overview (how it works, service summary)
      details/            Booking form (service, date, slot, details)
    booking/[reference]/  Booking confirmation
    find/                 Find an existing appointment
  admin/
    login/                Staff sign-in
    (protected)/          Authenticated dashboard
      page.tsx            Dashboard
      appointments/       List + detail
      calendar/           Day calendar
      services/           Service management
      availability/       Working hours + blocked periods
      settings/           Clinic settings
  actions/                Server actions (booking, contact, admin)
  api/availability/       Availability JSON endpoint
components/
  ui/                     Reusable UI primitives
  site/                   Public components
  admin/                  Dashboard components
lib/
  supabase.ts             Shared Supabase client + error helper
  auth/                   Sessions (RPC-backed), route guard
  appointments.ts         Booking CRUD, stats, status + reschedule
  availability.ts         Slot computation
  settings.ts services.ts blocked.ts contact.ts
  validation.ts datetime.ts status.ts format.ts email.ts demo.ts
supabase/
  schema.sql              Tables, indexes, RLS policies, functions, seed data
scripts/
  ts-loader.mjs           Extension resolver for running TS directly in Node
  test-flow.ts            End-to-end flow test
```

## Testing

Run the automated flow test:

```bash
npm run test:flow
```

It runs against the **configured Supabase project** and exercises the core
scenarios: bootstrap/seed integrity, staff sign-in (including a rejected wrong
password), availability rules (past dates, booking window, closed days, breaks),
booking creation, patient lookup, double-booking rejection, status transitions,
slot release on cancellation, rescheduling, settings validation, service
management and contact persistence. It removes the records it creates and reports
a pass/fail summary, exiting non-zero on any failure.

Complementary checks:

```bash
npm run typecheck   # TypeScript
npm run lint        # ESLint
npm run build       # Production build
```

## Deployment notes

- The database is a hosted Supabase project, so there is no local storage to
  provision. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  and (optionally) the Resend variables in the hosting environment.
- Apply `supabase/schema.sql` to each Supabase project (dev, staging, production)
  before first use.
- The app deploys as a standard Next.js Node server (or on any platform that
  supports Next.js), since all state lives in Supabase.
- Replace the demonstration accounts and adjust clinic settings before going
  live. Because the publishable key is public, rely on the RLS policies and
  functions in `schema.sql` — do not weaken them.

> This is a demonstration project and **not a real medical service**.
