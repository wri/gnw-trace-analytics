"use client";

import { useMemo } from "react";
import { Box, Flex, Heading, SimpleGrid, Table } from "@chakra-ui/react";
import type { TraceRow } from "@/lib/types";
import type { DailyMetrics } from "@/lib/analytics/daily";
import { computeErrorOverlap, countCategories } from "@/lib/analytics/aggregations";
import { formatCount, formatPercent } from "@/lib/format";
import { OUTCOME_COLORS, OUTCOME_LABELS } from "@/components/charts/palette";
import { ChartCard } from "@/components/charts/ChartCard";
import { DonutChart } from "@/components/charts/DonutChart";
import { DailyOutcomeAreaChart } from "@/components/charts/DailyOutcomeAreaChart";
import { Expander } from "@/components/ui/Expander";
import { StatCards } from "@/components/ui/StatCards";

const OUTCOME_RULES = [
  ["Success", "AI returns a non-empty answer and at least one tool call"],
  ["Defer", "Non-empty, non-error answer but no tool usage. Usually a clarification request"],
  ["Soft error", "Answer text matches error/apology heuristics"],
  ["Error", "Trace has an AI message but the final extracted answer is empty"],
  ["Empty", "No AI answer message found in output (failed request or timeout)"],
] as const;

interface OutcomesSectionProps {
  readonly rows: readonly TraceRow[];
  readonly daily: readonly DailyMetrics[];
}

export function OutcomesSection({ rows, daily }: OutcomesSectionProps) {
  const outcomeCounts = useMemo(
    () =>
      countCategories(rows.map((r) => r.outcome)).map((entry) => ({
        label: OUTCOME_LABELS[entry.label] ?? entry.label,
        count: entry.count,
      })),
    [rows]
  );
  const overlap = useMemo(() => computeErrorOverlap(rows), [rows]);

  return (
    <Box>
      <Heading as="h3" size="md" mb={3}>
        Outcomes
      </Heading>
      <Flex direction="column" gap={3}>
        <Expander title="ℹ️ What do the outcome categories mean?">
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Outcome</Table.ColumnHeader>
                <Table.ColumnHeader>Rule</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {OUTCOME_RULES.map(([outcome, rule]) => (
                <Table.Row key={outcome}>
                  <Table.Cell fontWeight="medium">{outcome}</Table.Cell>
                  <Table.Cell>{rule}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Expander>

        <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
          <ChartCard title="Outcome breakdown" help="Overall outcome mix across the selected period.">
            <DonutChart data={outcomeCounts} colors={OUTCOME_COLORS} />
          </ChartCard>
          {daily.length ? (
            <ChartCard title="Daily outcomes" help="Daily mix of outcomes as stacked rates.">
              <DailyOutcomeAreaChart data={daily} />
            </ChartCard>
          ) : null}
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
          <ChartCard
            title="Internal errors"
            help="Share of traces with any internal tool/API error."
          >
            <DonutChart
              data={[
                { label: "No internal error", count: overlap.total - overlap.internalErrors },
                { label: "Internal error", count: overlap.internalErrors },
              ]}
              colors={{ "No internal error": "#D5DAE5", "Internal error": "#FF2B2B" }}
            />
          </ChartCard>
          <ChartCard
            title="Internal vs user-visible overlap"
            help="How internal tool/API errors overlap with user-visible failures. Internal errors may be masked by agent recovery."
          >
            <DonutChart
              data={[
                { label: "No errors", count: overlap.noErrors },
                { label: "Internal only", count: overlap.internalOnly },
                { label: "User-visible only", count: overlap.userVisibleOnly },
                { label: "Both", count: overlap.both },
              ]}
              colors={{
                "No errors": "#D5DAE5",
                "Internal only": "#FFC107",
                "User-visible only": "#FF9800",
                Both: "#FF2B2B",
              }}
            />
          </ChartCard>
        </SimpleGrid>

        <Expander title="Error metrics">
          <StatCards
            items={[
              {
                label: "Internal errors",
                value: formatCount(overlap.internalErrors),
                hint: formatPercent(overlap.internalErrors / Math.max(1, overlap.total)),
              },
              {
                label: "User-visible errors",
                value: formatCount(overlap.userVisibleErrors),
                hint: formatPercent(overlap.userVisibleErrors / Math.max(1, overlap.total)),
              },
              { label: "Agent recovered", value: formatCount(overlap.recovered) },
              { label: "Hidden errors", value: formatCount(overlap.hiddenErrors) },
            ]}
            columns={4}
          />
        </Expander>
      </Flex>
    </Box>
  );
}
