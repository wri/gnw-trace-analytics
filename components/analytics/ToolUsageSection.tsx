"use client";

import { useMemo } from "react";
import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import type { TraceRow } from "@/lib/types";
import { computeToolUsage } from "@/lib/analytics/aggregations";
import { formatCount, formatPercent } from "@/lib/format";
import { ChartCard } from "@/components/charts/ChartCard";
import { ToolCallsScatterChart } from "@/components/charts/ToolCallsScatterChart";
import { StatCards } from "@/components/ui/StatCards";

interface ToolUsageSectionProps {
  readonly rows: readonly TraceRow[];
}

export function ToolUsageSection({ rows }: ToolUsageSectionProps) {
  const usage = useMemo(() => computeToolUsage(rows), [rows]);

  return (
    <Box>
      <Heading as="h3" size="md" mb={1}>
        Tool usage
      </Heading>
      <Text fontSize="sm" color="fg.muted" mb={3}>
        Per-turn tool metrics from the Zeno API. Deep agentic-flow analysis needs the
        full conversation tree and lives in Langfuse-backed tooling; reasoning-token
        charts are omitted (Gemini reports no reasoning tokens).
      </Text>
      <Flex direction="column" gap={4}>
        <StatCards
          items={[
            { label: "Avg tool calls / trace", value: usage.avgToolCalls.toFixed(2) },
            { label: "Max tool calls", value: formatCount(usage.maxToolCalls) },
            { label: "Tool error rate", value: formatPercent(usage.toolErrorRate) },
          ]}
          columns={3}
        />
        {usage.scatter.length ? (
          <ChartCard
            title="Tool calls vs latency"
            help="Per-trace tool-call count against latency, coloured by outcome."
          >
            <ToolCallsScatterChart data={usage.scatter} />
          </ChartCard>
        ) : null}
      </Flex>
    </Box>
  );
}
