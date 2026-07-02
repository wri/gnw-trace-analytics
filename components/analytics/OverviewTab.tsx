"use client";

/** Overview tab — headline KPIs with period-over-period deltas and trends. */

import { useMemo } from "react";
import { Flex, SimpleGrid, Text } from "@chakra-ui/react";
import type { TraceRow } from "@/lib/types";
import type { DailyMetrics } from "@/lib/analytics/daily";
import type { SummaryStats, PromptUtilisation } from "@/lib/analytics/aggregations";
import type { UserSegments } from "@/lib/analytics/segments";
import type { ReportContext } from "@/lib/analytics/report";
import {
  percentagePointDelta,
  relativeDelta,
  withMovingAverage,
} from "@/lib/analytics/compare";
import { formatCount, formatPercent, formatReportDate } from "@/lib/format";
import { KpiCard } from "@/components/ui/KpiCard";
import { ChartCard } from "@/components/charts/ChartCard";
import { DailyLinesChart } from "@/components/charts/DailyLinesChart";
import { DailyOutcomeAreaChart } from "@/components/charts/DailyOutcomeAreaChart";
import { SummarySection } from "@/components/analytics/SummarySection";

interface OverviewTabProps {
  readonly rows: readonly TraceRow[];
  readonly daily: readonly DailyMetrics[];
  readonly stats: SummaryStats;
  readonly prevStats: SummaryStats | null;
  readonly utilisation: PromptUtilisation;
  readonly prevUtilisation: PromptUtilisation | null;
  readonly segments: UserSegments | null;
  readonly prevSegments: UserSegments | null;
  readonly reportContext: ReportContext;
  readonly baseThreadUrl: string;
  readonly prevRangeLabel: string;
}

export function OverviewTab({
  rows,
  daily,
  stats,
  prevStats,
  utilisation,
  prevUtilisation,
  segments,
  prevSegments,
  reportContext,
  baseThreadUrl,
  prevRangeLabel,
}: OverviewTabProps) {
  const volumeData = useMemo(
    () =>
      withMovingAverage(daily as unknown as Record<string, unknown>[], "traces", 7),
    [daily]
  );
  const showMa = daily.length >= 10;

  const kpis = [
    {
      label: "Prompts (traces)",
      value: formatCount(stats.totalTraces),
      delta: prevStats
        ? relativeDelta(stats.totalTraces, prevStats.totalTraces, { upIsGood: true })
        : null,
    },
    {
      label: "Active users",
      value: formatCount(stats.uniqueUsers),
      delta: prevStats
        ? relativeDelta(stats.uniqueUsers, prevStats.uniqueUsers, { upIsGood: true })
        : null,
    },
    {
      label: "Conversations",
      value: formatCount(stats.uniqueThreads),
      delta: prevStats
        ? relativeDelta(stats.uniqueThreads, prevStats.uniqueThreads, { upIsGood: true })
        : null,
    },
    {
      label: "Success rate",
      value: formatPercent(stats.successRate),
      delta: prevStats
        ? percentagePointDelta(stats.successRate, prevStats.successRate, { upIsGood: true })
        : null,
    },
    ...(segments
      ? [
          {
            label: "New users",
            value: formatCount(segments.newUsers.size),
            delta: prevSegments
              ? relativeDelta(segments.newUsers.size, prevSegments.newUsers.size, {
                  upIsGood: true,
                })
              : null,
          },
          {
            label: "Engaged users",
            value: formatCount(segments.engagedUsers.size),
            delta: prevSegments
              ? relativeDelta(segments.engagedUsers.size, prevSegments.engagedUsers.size, {
                  upIsGood: true,
                })
              : null,
          },
        ]
      : []),
    {
      label: "Prompts / user / day",
      value: utilisation.meanPrompts.toFixed(2),
      delta: prevUtilisation
        ? relativeDelta(utilisation.meanPrompts, prevUtilisation.meanPrompts, {
            upIsGood: true,
          })
        : null,
    },
    {
      label: "p95 latency",
      value: `${stats.p95Latency.toFixed(1)}s`,
      delta: prevStats
        ? relativeDelta(stats.p95Latency, prevStats.p95Latency, { upIsGood: false })
        : null,
    },
    {
      label: "LLM cost",
      value: `$${stats.totalCost.toFixed(2)}`,
      delta: prevStats
        ? relativeDelta(stats.totalCost, prevStats.totalCost, { upIsGood: false })
        : null,
    },
  ];

  return (
    <Flex direction="column" gap={4}>
      <SimpleGrid columns={{ base: 2, md: 3, xl: 5 }} gap={3}>
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </SimpleGrid>
      {prevStats ? (
        <Text fontSize="xs" color="fg.muted" mt={-2}>
          Deltas compare against the previous period ({prevRangeLabel}).
        </Text>
      ) : null}

      <SimpleGrid columns={{ base: 1, xl: 2 }} gap={4}>
        {daily.length ? (
          <ChartCard
            title="Daily volume"
            help={`Daily traces, unique users, and unique threads${showMa ? " · dashed = 7-day average of traces" : ""}.`}
          >
            <DailyLinesChart
              data={volumeData}
              series={[
                { key: "traces", label: "Traces", color: "#0068C9" },
                { key: "uniqueUsers", label: "Unique users", color: "#12b76a" },
                { key: "uniqueThreads", label: "Unique threads", color: "#f58518" },
                ...(showMa
                  ? [{ key: "tracesMa", label: "Traces (7d avg)", color: "#98a2b3" }]
                  : []),
              ]}
              yLabel="Count"
            />
          </ChartCard>
        ) : null}
        {daily.length ? (
          <ChartCard title="Daily outcomes" help="Daily mix of outcomes as stacked rates.">
            <DailyOutcomeAreaChart data={daily} />
          </ChartCard>
        ) : null}
      </SimpleGrid>

      <SummarySection
        context={reportContext}
        rows={rows}
        baseThreadUrl={baseThreadUrl}
        heading={`Report (${formatReportDate(reportContext.startDate)} → ${formatReportDate(reportContext.endDate)})`}
      />
    </Flex>
  );
}
