# CLAUDE.md

Guidance for Claude Code (and other agents) working in this repository.

## What this is

Standalone Next.js 15 dashboard (App Router, TypeScript, Chakra UI v3,
Recharts, Zustand) for exploring **Global Nature Watch** agent traces, gated
to superusers. It is a **read-only consumer of the Zeno API** — it never
mutates server state and never talks to Langfuse directly.

## Commands

```bash
npm run dev        # http://localhost:3000 (sign-in via Resource Watch)
npm test           # vitest suite in tests/
npm run typecheck  # tsc --noEmit
```

There is no ESLint config; `typecheck` + `test` are the bar for every change.

## Architecture

Data flow, strictly one direction:

```
lib/api/zeno.ts            zod-validated fetch; offset pagination (MAX_PAGE_SIZE 200,
                           DEFAULT_MAX_TRACES 25k cap — page shows a truncation warning)
  → TraceRow (lib/types.ts)
  → lib/analytics/*        pure, unit-tested aggregation functions — ALL metric
                           logic lives here, never in components
  → components/analytics/* section components (receive plain data via props)
  → components/charts/*    chart primitives
```

Fetch orchestration and cross-tab memos live in `app/analytics/page.tsx`; the
previous window of equal length is fetched alongside for period-over-period
deltas (suppressed when the comparison window is empty). Filters live in
`stores/filtersStore.ts` (date presets incl. "All time" from
`EARLIEST_DATA_DATE`). Tests use `makeRow` from `tests/helpers.ts`.

## Domain invariants — violating these produces wrong numbers

- `outcome` (ANSWER/DEFER/SOFT_ERROR/ERROR/EMPTY) is assigned **server-side**
  in project-zeno (`src/api/services/langfuse/parse.py::derive_outcome`).
  Never re-map the codes silently. When reading project-zeno locally, fetch
  first — clones are often stale (`git show origin/main:<path>`).
- `lib/analytics/outcomeRefine.ts` is a client-side *derived view* (degraded
  answers, answered-from-context, UI-event quarantine, timeout suspects). It
  must never mutate `row.outcome`, and should defer to a server
  `outcome_detail` field once `parser_version ≥ 2` ships.
- `datasetsAnalysed` is **thread-cumulative**, not per-turn — that is exactly
  what makes the answered-from-context rescue valid.
- `turnTokens === 0` means "unknown", not zero — filter `> 0` before stats.
- Quantiles (`lib/analytics/stats.ts`) use pandas-compatible linear
  interpolation so numbers match tracey's historical reports. Don't swap
  methods.
- `language` comes from the API when present; `lib/analytics/language.ts`
  (franc) only fills nulls and carries an English-ambiguity guard because
  trigram detection mislabels short English queries. Never overwrite a server
  value.
- Machine users (`isMachineUserId`) are always excluded; fixture-listed
  internal users only when the "Exclude internal users" toggle is on.

## Charts

- Build from the primitives: `ChartCard`, `ChartTooltip`, `ChartLegend`,
  `palette.ts`. The categorical palette is CVD-validated and assigned in
  **fixed order — never cycle hues** past the palette; fold the tail into
  "Other" or switch to bars.
- Outcomes: use `OUTCOME_COLORS` + `OUTCOME_SEVERITY_ORDER` (best → worst) and
  `outcomeOrderIndex` for sorting, so ordering never depends on the data.
- If a series' stroke is not its identity color (e.g. white seams between
  stacked areas), pass `colorMap` to `ChartTooltip`/`ChartLegend` — otherwise
  the swatches render invisible.
- Recharts Sankey (see `OutcomeSankey`): sinks are justified to the right
  column; a node's outgoing links stack by target y. Source-direct flows are
  routed through invisible "spacer" nodes in the junction column so bands get
  their own lane and never cross the fan-out.

## Auth & secrets

The only credential is the signed-in user's Resource Watch bearer token in
`localStorage`; the server enforces superuser on **every** endpoint (the
client gate is UX only). No secrets belong in this repo — `.env*` is
gitignored and env vars are public `NEXT_PUBLIC_*` hosts only. Gotcha:
`api.staging.globalnaturewatch.org` resolves; `staging.api.…` does not.

## Docs

`docs/` is gitignored (local scratch / AI-generated output). The outcome
taxonomy improvement plan lives at `docs/outcome-taxonomy-plan.md` locally;
its subject — the classifier — lives in the project-zeno repo.
