"use client";

/** Users tab — acquisition, engagement, retention cohorts and top users. */

import { useMemo } from "react";
import { Flex, Heading, SimpleGrid, Text } from "@chakra-ui/react";
import type { TraceRow } from "@/lib/types";
import type { UserSegments } from "@/lib/analytics/segments";
import { buildDailyUserSegments } from "@/lib/analytics/segments";
import { computePromptUtilisation } from "@/lib/analytics/aggregations";
import { buildWeeklyRetention } from "@/lib/analytics/retention";
import { computeUserActivity } from "@/lib/analytics/topUsers";
import { binValues } from "@/lib/analytics/stats";
import { SEGMENT_COLORS } from "@/components/charts/palette";
import { ChartCard } from "@/components/charts/ChartCard";
import { StackedBarsChart } from "@/components/charts/StackedBarsChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { DailyLinesChart } from "@/components/charts/DailyLinesChart";
import { HistogramChart } from "@/components/charts/HistogramChart";
import { Expander } from "@/components/ui/Expander";
import { RetentionGrid } from "@/components/analytics/RetentionGrid";
import { TopUsersTable } from "@/components/analytics/TopUsersTable";

interface UsersTabProps {
  readonly rows: readonly TraceRow[];
  readonly segments: UserSegments | null;
  readonly startDate: string;
  readonly emailByUserId: ReadonlyMap<string, string> | null;
  readonly firstSeenByUser: ReadonlyMap<string, string> | null;
}

export function UsersTab({
  rows,
  segments,
  startDate,
  emailByUserId,
  firstSeenByUser,
}: UsersTabProps) {
  const utilisation = useMemo(() => computePromptUtilisation(rows), [rows]);
  const utilisationBins = useMemo(
    () => binValues(utilisation.userDayCounts, 30),
    [utilisation]
  );
  const dailySegments = useMemo(
    () =>
      segments
        ? buildDailyUserSegments(rows, segments.firstSeenByUser, segments.engagedUsers)
        : [],
    [rows, segments]
  );
  const retention = useMemo(
    () => buildWeeklyRetention(rows, firstSeenByUser),
    [rows, firstSeenByUser]
  );
  const activity = useMemo(() => computeUserActivity(rows), [rows]);

  return (
    <Flex direction="column" gap={4}>
      {segments && dailySegments.length > 1 ? (
        <>
          <Heading as="h4" size="sm">
            Acquisition &amp; engagement
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
      ) : (
        <Text fontSize="sm" color="fg.muted">
          Acquisition charts appear once user data is loaded and the window spans more
          than one day.
        </Text>
      )}

      <RetentionGrid retention={retention} />

      <TopUsersTable
        activity={activity}
        emailByUserId={emailByUserId}
        firstSeenByUser={firstSeenByUser}
      />

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
    </Flex>
  );
}
