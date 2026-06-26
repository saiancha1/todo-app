# Tasks — a full-stack to-do app

A small, finished task-management app: a .NET 10 REST API with JWT auth and per-user data
isolation, a Next.js frontend, and a lightweight MCP server. Every feature is wired end to end
— what the backend supports, the UI exposes, and the other way around.

- **Backend:** ASP.NET Core 10 Web API, EF Core + SQLite, JWT auth, xUnit tests
- **Frontend:** Next.js 16 (App Router, TypeScript), [shadcn/ui](https://ui.shadcn.com) components on Tailwind
- **MCP:** a small Model Context Protocol server exposing the API as agent tools (see [`mcp/`](mcp/README.md))

---

## Quick start

You need the **.NET 10 SDK** and **Node 20+**.

### Run both with one command (recommended)

From the repo root:

```bash
npm install              # installs the dev runner (concurrently)
npm run setup            # installs frontend dependencies (first time only)
npm run dev              # starts the API and frontend together
```

`npm run dev` runs both processes with colored, prefixed output (`api` / `web`) and shuts them
both down on `Ctrl+C`:

- API → http://localhost:5080 (explorer at http://localhost:5080/scalar/v1)
- Web → http://localhost:3000

Open http://localhost:3000, create an account, and start adding tasks. On first run the API
creates and migrates a local SQLite database (`backend/TodoApi/todo.db`) that persists across
restarts.

### Or run each separately

```bash
# Terminal 1 — backend (http://localhost:5080)
dotnet run --project backend/TodoApi --launch-profile http

# Terminal 2 — frontend (http://localhost:3000)
npm --prefix frontend install
npm --prefix frontend run dev
```

The frontend talks to the API at `http://localhost:5080` by default (override with
`NEXT_PUBLIC_API_URL`).

### Tests

```bash
dotnet test backend
```

---

## What's built

**Authentication & ownership.** Register and log in with email + password (BCrypt-hashed). The
API issues a JWT; every task endpoint requires it. Crucially, **every query is scoped to the
authenticated user** — there is no way to read or modify another user's tasks. A request for
someone else's task returns `404`, so the API never even confirms it exists. This is covered by
explicit tests (`OwnershipTests`).

**Tasks (full CRUD, wired both ways).**

- Create — form validates the title, clears on success, and **keeps your input if the server
  rejects it**.
- **Three workflow states** — To Do / In Progress / Done.
- List — with All / Active / Completed filters and a per-row status control.
- **Board** — a Trello-style three-column view (To Do / In Progress / Done); drag a card between
  columns to set its status. The chosen view is remembered.
- Edit — a dialog **pre-populated with the task's current values**.
- Delete — with per-row error feedback.

The UI is built with **shadcn/ui** components (accessible Radix primitives on Tailwind), including
a calendar + time picker for due dates and toast feedback for action failures. All list mutations
update the UI **immediately, with no page refresh**.

**Validation.** Blank/whitespace titles, invalid emails, short passwords, and duplicate
registrations are all rejected with a `400`/`409` and a user-facing message — never accepted
silently.

**Timezone-correct due dates.** Dates are stored and transmitted as UTC (always with a trailing
`Z`) and rendered in the viewer's local timezone. A value converter in the `DbContext` guarantees
SQLite reads come back as UTC, which is the subtle bug this design avoids.

**Logging.** A lightweight diagnostic baseline: one request line per call (method, path, status,
duration), an authenticated **user id attached to the log scope** of every request, and
application events at sensible levels — failed logins and not-found/not-owned task access at
`Warning`, registrations and task create/delete at `Information`. Unhandled exceptions are logged
with full context by the exception handler. Enough to investigate a reported issue from the logs;
metrics/tracing/aggregation are noted under "another day".

**MCP server.** `list_tasks`, `create_task`, `complete_task`, `delete_task` — reusing the same
endpoints and authorization. See [`mcp/README.md`](mcp/README.md).

---

## Architecture & trade-offs

The app is deliberately **flat**. It is a handful of CRUD endpoints over one entity, so it gets
one backend project, controllers that talk to `DbContext` directly, and no repository/CQRS/MediatR
layers. Those abstractions would be complexity with no second use. The only "extra" project is the
test project, which earns its place.

- **SQLite file, not in-memory.** The brief allowed either, but an app whose data vanishes on
  restart isn't really finished. A file-backed database persists and is still zero-setup.
- **DTOs separate from entities.** Requests and responses are records, so the API contract never
  leaks EF internals (e.g. the password hash).
- **JWT in `localStorage`.** Simple and appropriate for a local single-page app. For production
  I would move to an httpOnly cookie (see below).
- **Optimistic-ish list updates.** Mutations update local state from the server's response rather
  than refetching the whole list, keeping the UI snappy while staying consistent with the backend.

### Assumptions

- Single-region, single-instance deployment; SQLite is sufficient at this scale.
- The dev JWT signing key lives in `appsettings.json` for zero-setup runs. **It is clearly marked
  dev-only and must be overridden via the `Jwt__Key` environment variable in production.**
- Email is the username; no email verification flow.

---

## What I deliberately left out

These were conscious scope decisions, not omissions I'm hiding:

- **Refresh tokens / token revocation.** Tokens are short-lived (1 day) and not revocable. Fine
  for the exercise; a production app needs refresh + revocation.
- **Pagination.** The task list is unbounded. Trivial for a personal to-do list, necessary at
  scale.
- **Rate limiting on auth endpoints.** Would add before exposing login publicly.
- **Full observability** (metrics, distributed tracing, log aggregation to Seq/CloudWatch).
  There's a lightweight logging baseline (see above) — console output, structured, with user-id
  scopes — but no metrics or external sink. CI/CD and Docker are likewise out of scope per the brief.

---

## What another day would add

- **Move the JWT to an httpOnly, SameSite cookie** to remove the XSS token-theft surface, and add
  refresh-token rotation with server-side revocation.
- **Pagination + server-side search/sort** on the task list.
- **Postgres** instead of SQLite for concurrent multi-instance deployments (the EF Core model
  ports with a provider swap and a fresh migration).
- **Rate limiting** and account-lockout on auth.
- **Frontend tests** (component + a Playwright happy-path) to match the backend's test coverage.
- **Optimistic UI with rollback** for instant feedback even on slow networks.
- **Observability** — ship structured logs to an aggregator (Seq/CloudWatch), add request
  metrics and distributed tracing, and wire frontend error reporting.

---

## Project layout

```
backend/
  TodoApi/          ASP.NET Core 10 Web API
  TodoApi.Tests/    xUnit integration tests (ownership + validation)
frontend/           Next.js 16 app (App Router)
mcp/                MCP server exposing the API as agent tools
package.json        root dev runner — `npm run dev` starts API + web together
```
