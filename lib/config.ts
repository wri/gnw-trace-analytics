/** Runtime configuration derived from environment variables. */

const DEFAULT_API_HOST = "https://api.staging.globalnaturewatch.org";
const DEFAULT_RW_API_HOST = "https://api.resourcewatch.org";

export const API_HOST =
  process.env.NEXT_PUBLIC_API_HOST?.replace(/\/+$/, "") || DEFAULT_API_HOST;

export const RW_API_HOST =
  process.env.NEXT_PUBLIC_RW_API_URL?.replace(/\/+$/, "") ||
  DEFAULT_RW_API_HOST;

/** Zeno list/sessions endpoints cap `limit` at 200. */
export const MAX_PAGE_SIZE = 200;

/**
 * Lower bound for the "All time" date preset — predates the first Zeno
 * deployment (project-zeno's initial commit is 2024-10-23), so every trace
 * ever recorded falls inside the window.
 */
export const EARLIEST_DATA_DATE = "2024-10-01";

/** Default ceiling on rows pulled for the analytics window. */
export const DEFAULT_MAX_TRACES = 25000;

/** Trace Explorer pulls a smaller candidate list. */
export const EXPLORER_MAX_TRACES = 2000;

/** GNW's per-user daily prompt cap (reference line on utilisation charts). */
export const DAILY_PROMPT_LIMIT = 10;

/**
 * EMPTY traces at or above this latency are flagged as suspected gateway
 * timeouts (observed p95 ≈ 115s; gateways commonly cap around 300s).
 */
export const TIMEOUT_SUSPECT_SECONDS = 240;

/**
 * Ceiling on per-trace detail fetches for the non-English refusal audit —
 * each detail call hits Langfuse live, so this stays deliberately small.
 */
export const AUDIT_MAX_TRACES = 200;

export const ENVIRONMENT_OPTIONS = ["production", "staging", "all"] as const;
export type EnvironmentOption = (typeof ENVIRONMENT_OPTIONS)[number];

/** Base URL of the GNW threads UI for a given environment. */
export function baseThreadUrl(environment: EnvironmentOption): string {
  const host =
    environment === "staging"
      ? "https://www.staging.globalnaturewatch.org"
      : "https://www.globalnaturewatch.org";
  return `${host}/app/threads`;
}
