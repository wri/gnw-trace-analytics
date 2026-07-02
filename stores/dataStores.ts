"use client";

/**
 * Fetched-data stores. Data survives page navigation (like tracey's
 * session_state) and is refreshed explicitly via the Fetch buttons.
 */

import { create } from "zustand";
import type { GnwUser, SessionRow, TraceDetail, TraceListEntry, TraceRow } from "@/lib/types";

export type FetchStatus = "idle" | "loading" | "loaded" | "error";

interface FetchMeta {
  readonly status: FetchStatus;
  readonly error: string | null;
  readonly progress: number;
}

const idleMeta: FetchMeta = { status: "idle", error: null, progress: 0 };

// --- Analytics rows ---------------------------------------------------------

interface AnalyticsState extends FetchMeta {
  readonly rows: readonly TraceRow[];
  readonly fetchedRange: { startDate: string; endDate: string } | null;
  readonly start: () => void;
  readonly setProgress: (progress: number) => void;
  readonly succeed: (rows: readonly TraceRow[], startDate: string, endDate: string) => void;
  readonly fail: (error: string) => void;
}

export const useAnalyticsStore = create<AnalyticsState>()((set) => ({
  ...idleMeta,
  rows: [],
  fetchedRange: null,
  start: () => set({ status: "loading", error: null, progress: 0 }),
  setProgress: (progress) => set({ progress }),
  succeed: (rows, startDate, endDate) =>
    set({ status: "loaded", rows, error: null, fetchedRange: { startDate, endDate } }),
  fail: (error) => set({ status: "error", error }),
}));

// --- Users (first-seen source) ----------------------------------------------

interface UsersState extends FetchMeta {
  readonly users: readonly GnwUser[];
  readonly firstSeenByUser: ReadonlyMap<string, string> | null;
  readonly start: () => void;
  readonly setProgress: (progress: number) => void;
  readonly succeed: (
    users: readonly GnwUser[],
    firstSeenByUser: ReadonlyMap<string, string>
  ) => void;
  readonly fail: (error: string) => void;
}

export const useUsersStore = create<UsersState>()((set) => ({
  ...idleMeta,
  users: [],
  firstSeenByUser: null,
  start: () => set({ status: "loading", error: null, progress: 0 }),
  setProgress: (progress) => set({ progress }),
  succeed: (users, firstSeenByUser) =>
    set({ status: "loaded", users, firstSeenByUser, error: null }),
  fail: (error) => set({ status: "error", error }),
}));

// --- Sessions (Conversation Browser) ----------------------------------------

interface SessionsState extends FetchMeta {
  readonly sessions: readonly SessionRow[];
  readonly start: () => void;
  readonly setProgress: (progress: number) => void;
  readonly succeed: (sessions: readonly SessionRow[]) => void;
  readonly fail: (error: string) => void;
}

export const useSessionsStore = create<SessionsState>()((set) => ({
  ...idleMeta,
  sessions: [],
  start: () => set({ status: "loading", error: null, progress: 0 }),
  setProgress: (progress) => set({ progress }),
  succeed: (sessions) => set({ status: "loaded", sessions, error: null }),
  fail: (error) => set({ status: "error", error }),
}));

// --- Trace Explorer -----------------------------------------------------------

interface ExplorerState extends FetchMeta {
  readonly entries: readonly TraceListEntry[];
  readonly selectedId: string | null;
  readonly detailCache: Readonly<Record<string, TraceDetail>>;
  readonly detailStatus: FetchStatus;
  readonly detailError: string | null;
  readonly start: () => void;
  readonly setProgress: (progress: number) => void;
  readonly succeed: (entries: readonly TraceListEntry[]) => void;
  readonly fail: (error: string) => void;
  readonly select: (traceId: string | null) => void;
  readonly startDetail: () => void;
  readonly cacheDetail: (detail: TraceDetail) => void;
  readonly failDetail: (error: string) => void;
}

export const useExplorerStore = create<ExplorerState>()((set) => ({
  ...idleMeta,
  entries: [],
  selectedId: null,
  detailCache: {},
  detailStatus: "idle",
  detailError: null,
  start: () => set({ status: "loading", error: null, progress: 0 }),
  setProgress: (progress) => set({ progress }),
  succeed: (entries) =>
    set({
      status: "loaded",
      entries,
      error: null,
      selectedId: entries.length ? entries[0].id : null,
    }),
  fail: (error) => set({ status: "error", error }),
  select: (traceId) => set({ selectedId: traceId }),
  startDetail: () => set({ detailStatus: "loading", detailError: null }),
  cacheDetail: (detail) =>
    set((state) => ({
      detailStatus: "loaded",
      detailCache: { ...state.detailCache, [detail.id]: detail },
    })),
  failDetail: (error) => set({ detailStatus: "error", detailError: error }),
}));
