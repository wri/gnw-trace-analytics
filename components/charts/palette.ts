/** Chart colors — outcome colors match tracey; series colors follow GNW. */

export const OUTCOME_LABELS: Readonly<Record<string, string>> = {
  ANSWER: "Success",
  DEFER: "Defer",
  SOFT_ERROR: "Soft error",
  ERROR: "Error",
  EMPTY: "Error (Empty)",
};

export const OUTCOME_COLORS: Readonly<Record<string, string>> = {
  Success: "#0068C9",
  "Soft error": "#83C9FF",
  Defer: "#D5DAE5",
  "Error (Empty)": "#FFABAB",
  Error: "#FF2B2B",
};

/** Stacking order for the daily outcome chart (bottom → top). */
export const OUTCOME_STACK_ORDER = [
  "Error",
  "Error (Empty)",
  "Defer",
  "Soft error",
  "Success",
] as const;

/** Categorical palette (tableau10 — matches tracey's Altair defaults). */
export const CATEGORY_COLORS = [
  "#4c78a8",
  "#f58518",
  "#e45756",
  "#72b7b2",
  "#54a24b",
  "#eeca3b",
  "#b279a2",
  "#ff9da6",
  "#9d755d",
  "#bab0ac",
] as const;

export const SEGMENT_COLORS = {
  new: "#98a2b3",
  returning: "#2e90fa",
  notEngaged: "#d0d5dd",
  engaged: "#12b76a",
} as const;

export function categoryColor(index: number): string {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
}
