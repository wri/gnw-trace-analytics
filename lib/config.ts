/** Runtime configuration derived from environment variables. */

const DEFAULT_API_HOST = "https://api.staging.globalnaturewatch.org";
const DEFAULT_RW_API_HOST = "https://api.resourcewatch.org";

export const API_HOST =
  process.env.NEXT_PUBLIC_API_HOST?.replace(/\/+$/, "") || DEFAULT_API_HOST;

export const RW_API_HOST =
  process.env.NEXT_PUBLIC_RW_API_URL?.replace(/\/+$/, "") || DEFAULT_RW_API_HOST;

/** Zeno list/sessions endpoints cap `limit` at 200. */
export const MAX_PAGE_SIZE = 200;

/** Default ceiling on rows pulled for the analytics window. */
export const DEFAULT_MAX_TRACES = 25000;

/** Trace Explorer pulls a smaller candidate list. */
export const EXPLORER_MAX_TRACES = 2000;

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
