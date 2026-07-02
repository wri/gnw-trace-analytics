"use client";

import { useMemo } from "react";
import { Box, Flex, Heading, SimpleGrid, Text } from "@chakra-ui/react";
import type { TraceRow } from "@/lib/types";
import type { DailyMetrics } from "@/lib/analytics/daily";
import type { UserSegments } from "@/lib/analytics/segments";
import { buildDailyUserSegments } from "@/lib/analytics/segments";
import {
  computePromptUtilisation,
  computeStarterPromptMix,
} from "@/lib/analytics/aggregations";
import { STARTER_PROMPTS, STARTER_PROMPT_LABELS } from "@/lib/analytics/report";
import { binValues } from "@/lib/analytics/stats";
import { SEGMENT_COLORS } from "@/components/charts/palette";
import { ChartCard } from "@/components/charts/ChartCard";
import { DailyLinesChart } from "@/components/charts/DailyLinesChart";
import { StackedBarsChart } from "@/components/charts/StackedBarsChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { HistogramChart } from "@/components/charts/HistogramChart";
import { Expander } from "@/components/ui/Expander";

interface VolumeSectionProps {
  readonly rows: readonly TraceRow[];
  readonly daily: readonly DailyMetrics[];
  readonly segments: UserSegments | null;
  readonly startDate: string;
}

export function VolumeSection({ rows, daily, segments, startDate }: VolumeSectionProps) {
  const utilisation = useMemo(() => computePromptUtilisation(rows), [rows]);
  const starterMix = useMemo(
    () => computeStarterPromptMix(rows, STARTER_PROMPTS, STARTER_PROMPT_LABELS),
    [rows]
  );
  const dailySegments = useMemo(
    () =>
      segments
        ? buildDailyUserSegments(rows, segments.firstSeenByUser, segments.engagedUsers)
        : [],
    [rows, segments]
  );
  const utilisationBins = useMemo(
    () => binValues(utilisation.userDayCounts, 30),
    [utilisation]
  );

  return (
    <Box>
      <Heading as="h3" size="md" mb={3}>
        Volume &amp; Engagement
      </Heading>
      <Flex direction="column" gap={3}>
        <Expander title="ℹ️ Volume & engagement definitions">
          <Text fontSize="sm" whiteSpace="pre-wrap">
            {`• Traces = individual prompts sent to the system
• Threads = distinct conversation sessions (multi-turn chats)
• Unique users = distinct user IDs with ≥1 prompt
• User-days = total user × day combinations (one user on 3 days = 3)
• Engaged = user with ≥2 sessions each having ≥2 prompts`}
          </Text>
        </Expander>

        {daily.length ? (
          <ChartCard title="Daily volume" help="Daily traces, unique users, and unique threads.">
            <DailyLinesChart
              data={daily as unknown as Record<string, unknown>[]}
              series={[
                { key: "traces", label: "Traces", color: "#0068C9" },
                { key: "uniqueUsers", label: "Unique users", color: "#12b76a" },
                { key: "uniqueThreads", label: "Unique threads", color: "#f58518" },
              ]}
              yLabel="Count"
            />
          </ChartCard>
        ) : null}

        {segments && dailySegments.length > 1 ? (
          <>
            <Heading as="h4" size="sm">
              User segmentation
            </Heading>
            <Expander title="ℹ️ How are these categories defined?">
              <Text fontSize="sm" whiteSpace="pre-wrap">
                {`Users are classified along two independent dimensions:

Acquisition — New: first-ever activity on or after ${startDate}; Returning: first activity before ${startDate}.
On the daily chart a user is "New" only on their first-seen day; afterwards they count as "Returning".

Engagement — Engaged: ≥2 sessions each containing ≥2 prompts (applies to all users); Not Engaged: everyone else.

The donuts count each user once across the whole range; the daily chart counts each user once per active day.`}
              </Text>
            </Expander>

            <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
              <ChartCard
                title="Daily new vs returning"
                help="New = first trace on that day. Returning = first trace before that day."
              >
                <StackedBarsChart
                  data={dailySegments as unknown as Record<string, unknown>[]}
                  series={[
                    { key: "newUsers", label: "New", color: SEGMENT_COLORS.new },
                    { key: "returningUsers", label: "Returning", color: SEGMENT_COLORS.returning },
                  ]}
                  yLabel="Users"
                />
              </ChartCard>
              <ChartCard
                title="Total new vs returning"
                help="Unique users in the date range. New + Returning = total known users."
              >
                <DonutChart
                  data={[
                    { label: "New", count: segments.newUsers.size },
                    { label: "Returning", count: segments.returningUsers.size },
                  ]}
                  colors={{ New: SEGMENT_COLORS.new, Returning: SEGMENT_COLORS.returning }}
                  height={220}
                />
              </ChartCard>
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
              <ChartCard
                title="Daily engaged vs not engaged"
                help="Engaged = ≥2 sessions with ≥2 prompts each. Applies to all users."
              >
                <StackedBarsChart
                  data={dailySegments as unknown as Record<string, unknown>[]}
                  series={[
                    { key: "notEngagedUsers", label: "Not Engaged", color: SEGMENT_COLORS.notEngaged },
                    { key: "engagedUsers", label: "Engaged", color: SEGMENT_COLORS.engaged },
                  ]}
                  yLabel="Users"
                />
              </ChartCard>
              <ChartCard
                title="Total engaged vs not engaged"
                help="Unique users in the date range. Engaged + Not Engaged = total known users."
              >
                <DonutChart
                  data={[
                    { label: "Not Engaged", count: segments.notEngagedUsers.size },
                    { label: "Engaged", count: segments.engagedUsers.size },
                  ]}
                  colors={{
                    "Not Engaged": SEGMENT_COLORS.notEngaged,
                    Engaged: SEGMENT_COLORS.engaged,
                  }}
                  height={220}
                />
              </ChartCard>
            </SimpleGrid>
          </>
        ) : null}

        <Heading as="h4" size="sm">
          Prompt utilisation
        </Heading>
        {utilisation.userDays ? (
          <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
            <ChartCard
              title="Prompts per user per day (distribution)"
              help="Histogram of how many prompts users send on an active day."
            >
              <HistogramChart bins={utilisationBins} countLabel="User-days" height={260} />
            </ChartCard>
            <ChartCard
              title="Prompts per user per day (daily)"
              help="Daily mean/median/p95 prompts per active user. Red line = daily prompt limit (10)."
            >
              <DailyLinesChart
                data={utilisation.daily as unknown as Record<string, unknown>[]}
                series={[
                  { key: "meanPromptsPerUser", label: "Mean", color: "#0068C9" },
                  { key: "medianPromptsPerUser", label: "Median", color: "#12b76a" },
                  { key: "p95PromptsPerUser", label: "p95", color: "#f58518" },
                ]}
                yLabel="Prompts per user"
                valueFormatter={(v) => v.toFixed(2)}
                referenceY={10}
              />
            </ChartCard>
          </SimpleGrid>
        ) : (
          <Text fontSize="sm" color="fg.muted">
            No prompt utilisation data available.
          </Text>
        )}

        {starterMix.starterCount + starterMix.otherCount > 0 ? (
          <>
            <Heading as="h4" size="sm">
              Starter prompt mix
            </Heading>
            <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
              <ChartCard
                title="Starter vs other prompts"
                help="Share of prompts that match the pre-defined starter prompt library."
              >
                <DonutChart
                  data={[
                    { label: "Starter", count: starterMix.starterCount },
                    { label: "Other", count: starterMix.otherCount },
                  ]}
                  height={260}
                />
              </ChartCard>
              {starterMix.breakdown.length ? (
                <ChartCard
                  title="Starter prompt breakdown"
                  help="Which starter prompts are being used most."
                >
                  <DonutChart data={starterMix.breakdown} height={260} />
                </ChartCard>
              ) : null}
            </SimpleGrid>
          </>
        ) : null}
      </Flex>
    </Box>
  );
}
