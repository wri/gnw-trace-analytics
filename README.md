# GNW Trace Analytics

Standalone Next.js (TypeScript) dashboard for exploring **Global Nature Watch** agent
traces. It is the web-native successor to the read-path of *tracey* (the internal
Streamlit tool), rebuilt to match GNW's look and feel and gated to **superusers**.

## What it does

Data auto-fetches when you change the date range or environment (no fetch buttons),
and the **previous window of equal length is fetched alongside** so headline numbers
carry period-over-period deltas.

| Page | Source | Description |
|------|--------|-------------|
| **📊 Analytics** | `GET /api/traces` (Zeno API) | Product-focused tabs: **Overview** (KPI cards with vs-previous-period deltas, daily volume with 7-day average, daily outcomes, Slack summary + CSV export) · **Users** (acquisition/engagement segmentation, weekly retention cohorts, top users with email lookup and drill-through, prompt utilisation) · **Quality** (outcome mix, internal vs user-visible errors, tool usage) · **Performance** (cost + latency) · **Content** (prompt lengths, starter-prompt mix, datasets/AOI usage). |
| **🔎 Trace Explorer** | `GET /api/traces`, `GET /api/traces/{id}` | Filter traces (session id / trace id / prompt substring), then inspect a single trace: active turn, tool calls with results, output messages, cleaned + raw JSON, JSON download. Deep links `/traces?session=<id>` and `/traces?trace=<id>` auto-fetch. |
| **🔗 Conversation Browser** | `GET /api/traces/sessions` | Every thread in the window with search, sortable columns, pagination, user email column, `?user=<id>` filtering (linked from Top Users) and per-row links to the GNW Threads UI and the Trace Explorer. CSV export. |

User data comes from `GET /api/admin/users` (superuser-only) and is loaded
automatically once per session: each account's `createdAt` is the first-seen date
for New vs Returning and retention cohorts, and the id → email map makes user
tables human-readable.

Langfuse remains the source of truth for raw traces — this app only consumes the
Zeno API's server-side derived/aggregated data and never talks to Langfuse directly.

## Auth model

Identical to GNW (project-zeno-next):

1. "Sign in" redirects to the Resource Watch login
   (`{RW_API_HOST}/auth/login?origin=gnw&token=true&callbackUrl=…`).
2. `/auth/callback` receives `?token=…` and stores it in `localStorage`.
3. The app calls `GET /api/auth/me`; only accounts with `userType === "superuser"`
   get past the gate.
4. Every Zeno API request carries the signed-in user's own
   `Authorization: Bearer <token>` — **the server enforces superuser access on every
   endpoint**, so the client-side gate is purely UX. No shared secrets or service
   tokens exist anywhere in this app.

## Run locally

```bash
cp .env.example .env.local   # adjust hosts if needed
npm install
npm run dev                  # http://localhost:3000
```

Environment variables (all public, no secrets):

- `NEXT_PUBLIC_API_HOST` — Zeno API host (default `https://api.staging.globalnaturewatch.org`).
  NOTE: `api.staging.…` resolves; `staging.api.…` does NOT — don't swap them.
- `NEXT_PUBLIC_RW_API_URL` — Resource Watch auth host (default `https://api.resourcewatch.org`).

## Scripts

```bash
npm run dev        # dev server
npm run build      # production build
npm run start      # serve the production build
npm test           # vitest unit tests (analytics/stats/segments/parsing/mapping)
npm run typecheck  # tsc --noEmit
```

## Project layout

```
app/                 # Next.js App Router pages (analytics, traces, conversations, auth/callback)
components/          # AppShell, AuthGate, filters, charts (Recharts), trace detail views
lib/
  api/               # Zeno + users API clients (fetch with retry, zod-validated)
  analytics/         # stats, daily metrics, segmentation, aggregations, report builders
  traces/            # AgentState message parsing (active turn, tool calls)
  auth/              # Resource Watch token management
fixtures/            # internal user ids + starter prompts (copied from tracey)
stores/              # Zustand stores (auth, filters, fetched data)
theme/               # Chakra UI v3 system with GNW tokens (IBM Plex, #0041B1, …)
tests/               # vitest unit tests for lib/
```

## Parity notes vs tracey

- Per-turn token/tool/dataset numbers are computed server-side by the Zeno API and
  match tracey's Zeno-backed tabs (lower — and correct — vs. old cumulative numbers).
- Machine users (`user_id` containing "machine") are always excluded; internal users
  (fixture list) are excluded via the "Exclude internal users" toggle.
- Percentiles use pandas-compatible linear interpolation, so numbers match tracey's
  reports.
- **Intentionally omitted:** prompt language detection (tracey used the `langid`
  Python model — no lightweight browser equivalent), the Langfuse-backed tabs
  (Human Eval, Eval Insights, Product Intelligence) and the Gemini-powered features.
