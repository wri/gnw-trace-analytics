"use client";

import { Box, Table, Text } from "@chakra-ui/react";
import type { RetentionResult } from "@/lib/analytics/retention";
import { ChartCard } from "@/components/charts/ChartCard";
import { formatCount } from "@/lib/format";

interface RetentionGridProps {
  readonly retention: RetentionResult;
}

/** GNW-blue heat cell: opacity scales with the retention rate. */
function cellBackground(rate: number): string {
  const alpha = Math.min(1, Math.max(0.06, rate));
  return `rgba(0, 65, 177, ${alpha.toFixed(2)})`;
}

/** Weekly cohort retention heat table. */
export function RetentionGrid({ retention }: RetentionGridProps) {
  const { cohorts, maxOffset, weeksInWindow } = retention;

  if (weeksInWindow < 2) {
    return (
      <ChartCard
        title="Weekly retention cohorts"
        help="Share of each week's new users who come back in later weeks."
      >
        <Text fontSize="sm" color="fg.muted">
          Retention needs at least two calendar weeks of data — widen the date range
          (e.g. “Last month”) to populate the cohort grid.
        </Text>
      </ChartCard>
    );
  }

  const offsets = Array.from({ length: maxOffset + 1 }, (_, i) => i);

  return (
    <ChartCard
      title="Weekly retention cohorts"
      help="Each row is the users first seen that week; each cell is the share of them active N weeks later (within the loaded window). Darker = better retention."
    >
      <Box overflowX="auto">
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Cohort week</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right">Users</Table.ColumnHeader>
              {offsets.map((offset) => (
                <Table.ColumnHeader key={offset} textAlign="center">
                  W{offset}
                </Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {cohorts.map((cohort) => (
              <Table.Row key={cohort.cohortWeek}>
                <Table.Cell fontFamily="mono" fontSize="xs" whiteSpace="nowrap">
                  {cohort.cohortWeek}
                </Table.Cell>
                <Table.Cell textAlign="right">{formatCount(cohort.size)}</Table.Cell>
                {offsets.map((offset) => {
                  const cell = cohort.cells[offset];
                  if (!cell || !cell.observed) {
                    return <Table.Cell key={offset} />;
                  }
                  return (
                    <Table.Cell
                      key={offset}
                      textAlign="center"
                      fontSize="xs"
                      style={{
                        backgroundColor: cellBackground(cell.rate),
                        color: cell.rate > 0.45 ? "white" : undefined,
                      }}
                      title={`${cell.activeUsers} of ${cohort.size} users active`}
                    >
                      {(cell.rate * 100).toFixed(0)}%
                    </Table.Cell>
                  );
                })}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>
    </ChartCard>
  );
}
