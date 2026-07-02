"use client";

/**
 * Analytics — server-side per-turn aggregates from the Zeno API, organised
 * into product-focused tabs. Data auto-fetches when filters change; the
 * previous window of equal length is fetched alongside for KPI deltas.
 */

import { useEffect, useMemo, useRef } from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  Spinner,
  Tabs,
  Text,
} from "@chakra-ui/react";
import { ArrowsClockwiseIcon } from "@phosphor-icons/react";
import { AuthGate } from "@/components/AuthGate";
import { AppShell } from "@/components/AppShell";
import { FiltersBar } from "@/components/FiltersBar";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { OverviewTab } from "@/components/analytics/OverviewTab";
import { UsersTab } from "@/components/analytics/UsersTab";
import { OutcomesSection } from "@/components/analytics/OutcomesSection";
import { ToolUsageSection } from "@/components/analytics/ToolUsageSection";
import { CostLatencySection } from "@/components/analytics/CostLatencySection";
import { PromptSection } from "@/components/analytics/PromptSection";
import { StarterMixSection } from "@/components/analytics/StarterMixSection";
import { GnwUsageSection } from "@/components/analytics/GnwUsageSection";
import { useFiltersStore } from "@/stores/filtersStore";
import { useAnalyticsStore, useUsersStore } from "@/stores/dataStores";
import { fetchTracesWindow } from "@/lib/api/zeno";
import { buildUserFirstSeenMap, fetchAllUsers } from "@/lib/api/users";
import { keepUserId } from "@/lib/filters";
import { baseThreadUrl, DEFAULT_MAX_TRACES } from "@/lib/config";
import { computeDailyMetrics } from "@/lib/analytics/daily";
import {
  computePromptUtilisation,
  computeSummaryStats,
} from "@/lib/analytics/aggregations";
import { classifyUserSegments } from "@/lib/analytics/segments";
import { previousRange } from "@/lib/analytics/compare";
import { formatCount, formatReportDate } from "@/lib/format";
import type { TraceRow } from "@/lib/types";

const AUTO_FETCH_DEBOUNCE_MS = 400;

function useFilteredRows(
  rows: readonly TraceRow[] | null,
  excludeInternal: boolean,
  environment: string
): readonly TraceRow[] {
  return useMemo(
    () =>
      (rows ?? []).filter(
        (row) =>
          keepUserId(row.userId, { excludeInternal }) &&
          (environment === "all" || row.environment === environment)
      ),
    [rows, excludeInternal, environment]
  );
}

function AnalyticsView() {
  const { startDate, endDate, environment, excludeInternal } = useFiltersStore();
  const analytics = useAnalyticsStore();
  const users = useUsersStore();
  const abortRef = useRef<AbortController | null>(null);

  const signature = `${startDate}|${endDate}|${environment}`;
  const validRange = Boolean(startDate && endDate && startDate <= endDate);

  async function runFetch(sig: string) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    analytics.start(sig);
    try {
      const env = environment === "all" ? undefined : environment;
      const prev = previousRange({ startDate, endDate });
      const [rows, prevRows] = await Promise.all([
        fetchTracesWindow(
          { startDate, endDate, environment: env },
          {
            maxItems: DEFAULT_MAX_TRACES,
            signal: controller.signal,
            onProgress: (fetched) => analytics.setProgress(fetched),
          }
        ),
        // Comparison window is best-effort — deltas simply hide on failure.
        fetchTracesWindow(
          { ...prev, environment: env },
          { maxItems: DEFAULT_MAX_TRACES, signal: controller.signal }
        ).catch(() => null),
      ]);
      if (controller.signal.aborted) return;
      analytics.succeed({ rows, prevRows, startDate, endDate, signature: sig });
    } catch (error) {
      if (controller.signal.aborted) return;
      analytics.fail(error instanceof Error ? error.message : String(error));
    }
  }

  // Auto-fetch when the filter signature changes (debounced for date typing).
  useEffect(() => {
    if (!validRange) return;
    if (analytics.signature === signature && analytics.status !== "idle") return;
    const timer = setTimeout(() => void runFetch(signature), AUTO_FETCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, validRange]);

  // Load the user table once per session (first-seen dates + email lookup).
  useEffect(() => {
    if (users.status !== "idle") return;
    users.start();
    fetchAllUsers({ onProgress: (fetched) => users.setProgress(fetched) })
      .then((allUsers) => users.succeed(allUsers, buildUserFirstSeenMap(allUsers)))
      .catch((error) =>
        users.fail(error instanceof Error ? error.message : String(error))
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rawCount = analytics.rows.length;
  const rows = useFilteredRows(analytics.rows, excludeInternal, environment);
  const prevRows = useFilteredRows(analytics.prevRows, excludeInternal, environment);
  const hasPrev = analytics.prevRows !== null;
  const excludedCount = rawCount - rows.length;

  const range = analytics.fetchedRange ?? { startDate, endDate };
  const prevRange = previousRange(range);

  const daily = useMemo(() => computeDailyMetrics(rows), [rows]);
  const stats = useMemo(() => computeSummaryStats(rows), [rows]);
  const utilisation = useMemo(() => computePromptUtilisation(rows), [rows]);
  const prevStats = useMemo(
    () => (hasPrev ? computeSummaryStats(prevRows) : null),
    [hasPrev, prevRows]
  );
  const prevUtilisation = useMemo(
    () => (hasPrev ? computePromptUtilisation(prevRows) : null),
    [hasPrev, prevRows]
  );
  const segments = useMemo(
    () =>
      users.firstSeenByUser
        ? classifyUserSegments(rows, users.firstSeenByUser, range.startDate, range.endDate)
        : null,
    [rows, users.firstSeenByUser, range.startDate, range.endDate]
  );
  const prevSegments = useMemo(
    () =>
      hasPrev && users.firstSeenByUser
        ? classifyUserSegments(
            prevRows,
            users.firstSeenByUser,
            prevRange.startDate,
            prevRange.endDate
          )
        : null,
    [hasPrev, prevRows, users.firstSeenByUser, prevRange.startDate, prevRange.endDate]
  );

  const reportContext = useMemo(
    () => ({
      startDate: range.startDate,
      endDate: range.endDate,
      stats,
      utilisation,
      segments,
      totalKnownUsers: users.firstSeenByUser?.size ?? 0,
    }),
    [range, stats, utilisation, segments, users.firstSeenByUser]
  );

  const threadUrl = baseThreadUrl(environment);
  const isLoading = analytics.status === "loading";

  return (
    <Flex direction="column" gap={5}>
      <Box>
        <Heading size="lg">📊 Trace Analytics</Heading>
        <Text color="fg.muted" fontSize="sm" mt={1}>
          User behaviour and app analytics from the Zeno API (server-side, per-turn
          aggregation). Data refreshes automatically when you change the filters.
        </Text>
      </Box>

      <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="lg" p={4}>
        <FiltersBar />
        <Flex gap={3} mt={3} align="center" wrap="wrap" fontSize="xs" color="fg.muted">
          {isLoading ? (
            <Flex align="center" gap={2}>
              <Spinner size="xs" color="primary.solid" />
              <Text>
                Fetching traces… {formatCount(analytics.progress)} loaded
                {users.status === "loading"
                  ? ` · users ${formatCount(users.progress)}`
                  : ""}
              </Text>
            </Flex>
          ) : analytics.fetchedAt ? (
            <>
              <Text>
                Data as of {new Date(analytics.fetchedAt).toLocaleTimeString()} ·{" "}
                {formatCount(rows.length)} traces
                {excludedCount > 0
                  ? ` (${formatCount(excludedCount)} internal/machine excluded)`
                  : ""}
                {hasPrev ? "" : " · comparison window unavailable"}
              </Text>
              <Button size="xs" variant="ghost" onClick={() => void runFetch(signature)}>
                <ArrowsClockwiseIcon />
                Refresh
              </Button>
            </>
          ) : null}
        </Flex>
      </Box>

      {!validRange ? (
        <InlineAlert status="warning" message="Start date must be on or before end date." />
      ) : null}
      {analytics.status === "error" && analytics.error ? (
        <InlineAlert status="error" title="Trace fetch failed" message={analytics.error} />
      ) : null}
      {users.status === "error" && users.error ? (
        <InlineAlert
          status="warning"
          title="User data unavailable"
          message={`${users.error}\nNew vs Returning metrics and email lookups are disabled.`}
        />
      ) : null}

      {analytics.status === "loaded" && rows.length === 0 ? (
        <InlineAlert status="warning" message="No traces matched the selected window/filters." />
      ) : null}

      {rows.length > 0 ? (
        <Tabs.Root defaultValue="overview" lazyMount>
          <Tabs.List>
            <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
            <Tabs.Trigger value="users">Users</Tabs.Trigger>
            <Tabs.Trigger value="quality">Quality</Tabs.Trigger>
            <Tabs.Trigger value="performance">Performance</Tabs.Trigger>
            <Tabs.Trigger value="content">Content</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="overview">
            <OverviewTab
              rows={rows}
              daily={daily}
              stats={stats}
              prevStats={prevStats}
              utilisation={utilisation}
              prevUtilisation={prevUtilisation}
              segments={segments}
              prevSegments={prevSegments}
              reportContext={reportContext}
              baseThreadUrl={threadUrl}
              prevRangeLabel={`${formatReportDate(prevRange.startDate)} → ${formatReportDate(prevRange.endDate)}`}
            />
          </Tabs.Content>

          <Tabs.Content value="users">
            <UsersTab
              rows={rows}
              segments={segments}
              startDate={range.startDate}
              emailByUserId={users.emailByUserId}
              firstSeenByUser={users.firstSeenByUser}
            />
          </Tabs.Content>

          <Tabs.Content value="quality">
            <Flex direction="column" gap={6}>
              <OutcomesSection rows={rows} daily={daily} />
              <ToolUsageSection rows={rows} />
            </Flex>
          </Tabs.Content>

          <Tabs.Content value="performance">
            <CostLatencySection rows={rows} daily={daily} stats={stats} />
          </Tabs.Content>

          <Tabs.Content value="content">
            <Flex direction="column" gap={6}>
              <PromptSection rows={rows} />
              <StarterMixSection rows={rows} />
              <GnwUsageSection rows={rows} />
            </Flex>
          </Tabs.Content>
        </Tabs.Root>
      ) : null}
    </Flex>
  );
}

export default function AnalyticsPage() {
  return (
    <AuthGate>
      <AppShell>
        <AnalyticsView />
      </AppShell>
    </AuthGate>
  );
}
