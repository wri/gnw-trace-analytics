"use client";

/** Analytics page — server-side per-turn aggregates from the Zeno API. */

import { useMemo } from "react";
import { Box, Button, Flex, Heading, Separator, Text } from "@chakra-ui/react";
import { RocketLaunchIcon, UsersThreeIcon } from "@phosphor-icons/react";
import { AuthGate } from "@/components/AuthGate";
import { AppShell } from "@/components/AppShell";
import { FiltersBar } from "@/components/FiltersBar";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { SummarySection } from "@/components/analytics/SummarySection";
import { OutcomesSection } from "@/components/analytics/OutcomesSection";
import { VolumeSection } from "@/components/analytics/VolumeSection";
import { CostLatencySection } from "@/components/analytics/CostLatencySection";
import { PromptSection } from "@/components/analytics/PromptSection";
import { GnwUsageSection } from "@/components/analytics/GnwUsageSection";
import { ToolUsageSection } from "@/components/analytics/ToolUsageSection";
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
import { formatCount, formatReportDate } from "@/lib/format";

function AnalyticsView() {
  const { startDate, endDate, environment, excludeInternal } =
    useFiltersStore();
  const analytics = useAnalyticsStore();
  const users = useUsersStore();

  async function handleFetchTraces() {
    analytics.start();
    try {
      const rows = await fetchTracesWindow(
        {
          startDate,
          endDate,
          environment: environment === "all" ? undefined : environment,
        },
        {
          maxItems: DEFAULT_MAX_TRACES,
          onProgress: (fetched) => analytics.setProgress(fetched),
        },
      );
      analytics.succeed(rows, startDate, endDate);
    } catch (error) {
      analytics.fail(error instanceof Error ? error.message : String(error));
    }
  }

  async function handleFetchUsers() {
    users.start();
    try {
      const allUsers = await fetchAllUsers({
        onProgress: (fetched) => users.setProgress(fetched),
      });
      users.succeed(allUsers, buildUserFirstSeenMap(allUsers));
    } catch (error) {
      users.fail(error instanceof Error ? error.message : String(error));
    }
  }

  const rawCount = analytics.rows.length;
  const rows = useMemo(
    () =>
      analytics.rows.filter(
        (row) =>
          keepUserId(row.userId, { excludeInternal }) &&
          (environment === "all" || row.environment === environment),
      ),
    [analytics.rows, excludeInternal, environment],
  );
  const excludedCount = rawCount - rows.length;

  const range = analytics.fetchedRange ?? { startDate, endDate };
  const daily = useMemo(() => computeDailyMetrics(rows), [rows]);
  const stats = useMemo(() => computeSummaryStats(rows), [rows]);
  const utilisation = useMemo(() => computePromptUtilisation(rows), [rows]);
  const segments = useMemo(
    () =>
      users.firstSeenByUser
        ? classifyUserSegments(
            rows,
            users.firstSeenByUser,
            range.startDate,
            range.endDate,
          )
        : null,
    [rows, users.firstSeenByUser, range.startDate, range.endDate],
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
    [range, stats, utilisation, segments, users.firstSeenByUser],
  );

  const threadUrl = baseThreadUrl(environment);

  return (
    <Flex direction="column" gap={5}>
      <Box>
        <Heading size="lg">📊 Trace Analytics</Heading>
        <Text color="fg.muted" fontSize="sm" mt={1}>
          Aggregate volume, outcomes, latency, cost, tool usage and errors
          across the fetched traces — read from the Zeno API (server-side,
          per-turn aggregation) · {formatReportDate(startDate)} →{" "}
          {formatReportDate(endDate)}
        </Text>
      </Box>

      <Box
        bg="bg.panel"
        borderWidth="1px"
        borderColor="border"
        borderRadius="lg"
        p={4}
      >
        <FiltersBar />
        <Flex gap={3} mt={4} wrap="wrap">
          <Button
            size="sm"
            colorPalette="primary"
            onClick={handleFetchTraces}
            loading={analytics.status === "loading"}
            loadingText={`Fetching… ${formatCount(analytics.progress)} traces`}
          >
            <RocketLaunchIcon />
            Fetch from Zeno API
          </Button>
          <Button
            size="sm"
            variant={users.status === "loaded" ? "outline" : "solid"}
            colorPalette={users.status === "loaded" ? "gray" : "primary"}
            onClick={handleFetchUsers}
            loading={users.status === "loading"}
            loadingText={`Fetching… ${formatCount(users.progress)} users`}
          >
            <UsersThreeIcon />
            {users.status === "loaded"
              ? `Users loaded (${formatCount(users.users.length)}) — refresh`
              : "Fetch users (enables New vs Returning)"}
          </Button>
        </Flex>
      </Box>

      {analytics.status === "error" && analytics.error ? (
        <InlineAlert
          status="error"
          title="Trace fetch failed"
          message={analytics.error}
        />
      ) : null}
      {users.status === "error" && users.error ? (
        <InlineAlert
          status="error"
          title="User fetch failed"
          message={users.error}
        />
      ) : null}

      {analytics.status !== "loaded" ? (
        <InlineAlert
          status="info"
          message={
            "This page reads aggregate analytics from the Zeno API.\nSet the date range / environment above, then click “Fetch from Zeno API”. Per-turn token/tool/dataset numbers are computed server-side."
          }
        />
      ) : rows.length === 0 ? (
        <InlineAlert
          status="warning"
          message="No traces matched the selected window/filters."
        />
      ) : (
        <>
          {excludedCount > 0 ? (
            <InlineAlert
              status="info"
              message={`${formatCount(rawCount)} traces fetched · ${formatCount(excludedCount)} internal/machine traces excluded · ${formatCount(rows.length)} used for analytics`}
            />
          ) : null}
          {!segments ? (
            <InlineAlert
              status="info"
              message="Use “Fetch users” above to enable New vs Returning user metrics."
            />
          ) : null}

          <SummarySection
            context={reportContext}
            rows={rows}
            baseThreadUrl={threadUrl}
          />
          <Separator />
          <OutcomesSection rows={rows} daily={daily} />
          <Separator />
          <VolumeSection
            rows={rows}
            daily={daily}
            segments={segments}
            startDate={range.startDate}
          />
          <Separator />
          <CostLatencySection rows={rows} daily={daily} stats={stats} />
          <Separator />
          <PromptSection rows={rows} />
          <Separator />
          <GnwUsageSection rows={rows} />
          <Separator />
          <ToolUsageSection rows={rows} />
        </>
      )}
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
