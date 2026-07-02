"use client";

import { useMemo } from "react";
import { Box, Flex, Heading, SimpleGrid, Text } from "@chakra-ui/react";
import type { TraceRow } from "@/lib/types";
import type { DailyMetrics } from "@/lib/analytics/daily";
import type { SummaryStats } from "@/lib/analytics/aggregations";
import { binValues, finiteNumbers } from "@/lib/analytics/stats";
import { formatCount } from "@/lib/format";
import { ChartCard } from "@/components/charts/ChartCard";
import { HistogramChart } from "@/components/charts/HistogramChart";
import { DailyLinesChart } from "@/components/charts/DailyLinesChart";
import { Expander } from "@/components/ui/Expander";
import { StatCards } from "@/components/ui/StatCards";

interface CostLatencySectionProps {
  readonly rows: readonly TraceRow[];
  readonly daily: readonly DailyMetrics[];
  readonly stats: SummaryStats;
}

export function CostLatencySection({ rows, daily, stats }: CostLatencySectionProps) {
  const costBins = useMemo(
    () => binValues(finiteNumbers(rows.map((r) => r.totalCost)), 30),
    [rows]
  );
  const latencyBins = useMemo(
    () => binValues(finiteNumbers(rows.map((r) => r.latencySeconds)), 30),
    [rows]
  );

  return (
    <Flex direction="column" gap={6}>
      <Box>
        <Heading as="h3" size="md" mb={3}>
          Cost
        </Heading>
        <Flex direction="column" gap={3}>
          <Expander title="ℹ️ How is cost calculated?">
            <Text fontSize="sm">
              Cost is the total LLM spend per trace as reported by Langfuse (totalCost).
              It includes all generation steps within the trace (tool-use calls, retries,
              etc.). Mean gives the average spend; p95 shows the worst-case for most
              users; median is less sensitive to outlier-heavy traces.
            </Text>
          </Expander>
          <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
            <ChartCard title="Cost distribution" help="Histogram of per-trace LLM cost.">
              {stats.costCount ? (
                <Flex direction="column" gap={3}>
                  <StatCards
                    items={[
                      { label: "Total", value: `$${stats.totalCost.toFixed(2)}` },
                      { label: "Mean", value: `$${stats.meanCost.toFixed(4)}` },
                      { label: "Median", value: `$${stats.medianCost.toFixed(4)}` },
                      { label: "P95", value: `$${stats.p95Cost.toFixed(4)}` },
                      { label: "Max", value: `$${stats.maxCost.toFixed(4)}` },
                    ]}
                  />
                  <HistogramChart
                    bins={costBins}
                    edgeFormatter={(v) => `$${v.toFixed(4)}`}
                  />
                </Flex>
              ) : (
                <Text fontSize="sm" color="fg.muted">
                  No cost data available.
                </Text>
              )}
            </ChartCard>
            {daily.length ? (
              <ChartCard title="Daily cost" help="Mean and p95 LLM cost per day.">
                <DailyLinesChart
                  data={daily as unknown as Record<string, unknown>[]}
                  series={[
                    { key: "meanCost", label: "Mean cost", color: "#0068C9" },
                    { key: "p95Cost", label: "p95 cost", color: "#f58518" },
                  ]}
                  yLabel="USD"
                  valueFormatter={(v) => `$${v.toFixed(4)}`}
                />
              </ChartCard>
            ) : null}
          </SimpleGrid>
        </Flex>
      </Box>

      <Box>
        <Heading as="h3" size="md" mb={3}>
          Latency
        </Heading>
        <Flex direction="column" gap={3}>
          <Expander title="ℹ️ What does latency measure?">
            <Text fontSize="sm">
              Latency is the wall-clock time from request receipt to final response, as
              recorded by Langfuse. It includes LLM inference, tool execution, retries,
              and any network overhead. p95 is a good proxy for worst-case user
              experience.
            </Text>
          </Expander>
          <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
            <ChartCard title="Latency distribution" help="Histogram of per-trace latency.">
              {stats.latencyCount ? (
                <Flex direction="column" gap={3}>
                  <StatCards
                    items={[
                      { label: "Total traces", value: formatCount(stats.latencyCount) },
                      { label: "Mean", value: `${stats.meanLatency.toFixed(2)}s` },
                      { label: "Median", value: `${stats.medianLatency.toFixed(2)}s` },
                      { label: "P95", value: `${stats.p95Latency.toFixed(2)}s` },
                      { label: "Max", value: `${stats.maxLatency.toFixed(2)}s` },
                    ]}
                  />
                  <HistogramChart
                    bins={latencyBins}
                    edgeFormatter={(v) => `${v.toFixed(1)}s`}
                  />
                </Flex>
              ) : (
                <Text fontSize="sm" color="fg.muted">
                  No latency data available.
                </Text>
              )}
            </ChartCard>
            {daily.length ? (
              <ChartCard title="Daily latency" help="Mean and p95 latency per day.">
                <DailyLinesChart
                  data={daily as unknown as Record<string, unknown>[]}
                  series={[
                    { key: "meanLatency", label: "Mean latency", color: "#0068C9" },
                    { key: "p95Latency", label: "p95 latency", color: "#f58518" },
                  ]}
                  yLabel="Seconds"
                  valueFormatter={(v) => `${v.toFixed(2)}s`}
                />
              </ChartCard>
            ) : null}
          </SimpleGrid>
        </Flex>
      </Box>
    </Flex>
  );
}
