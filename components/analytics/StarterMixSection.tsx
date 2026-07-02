"use client";

import { useMemo } from "react";
import { Box, Heading, SimpleGrid } from "@chakra-ui/react";
import type { TraceRow } from "@/lib/types";
import { computeStarterPromptMix } from "@/lib/analytics/aggregations";
import { STARTER_PROMPTS, STARTER_PROMPT_LABELS } from "@/lib/analytics/report";
import { ChartCard } from "@/components/charts/ChartCard";
import { DonutChart } from "@/components/charts/DonutChart";

interface StarterMixSectionProps {
  readonly rows: readonly TraceRow[];
}

/** Starter prompt adoption — which canned prompts drive engagement. */
export function StarterMixSection({ rows }: StarterMixSectionProps) {
  const starterMix = useMemo(
    () => computeStarterPromptMix(rows, STARTER_PROMPTS, STARTER_PROMPT_LABELS),
    [rows]
  );

  if (starterMix.starterCount + starterMix.otherCount === 0) return null;

  return (
    <Box>
      <Heading as="h4" size="sm" mb={3}>
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
    </Box>
  );
}
