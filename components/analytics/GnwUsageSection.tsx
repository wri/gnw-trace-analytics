"use client";

import { useMemo } from "react";
import { Box, Flex, Heading, SimpleGrid, Text } from "@chakra-ui/react";
import type { TraceRow } from "@/lib/types";
import { countAoiNames, countCategories } from "@/lib/analytics/aggregations";
import { ChartCard } from "@/components/charts/ChartCard";
import { DonutChart } from "@/components/charts/DonutChart";
import { HorizontalBarChart } from "@/components/charts/HorizontalBarChart";
import { Expander } from "@/components/ui/Expander";

interface GnwUsageSectionProps {
  readonly rows: readonly TraceRow[];
}

export function GnwUsageSection({ rows }: GnwUsageSectionProps) {
  const datasetCounts = useMemo(
    () =>
      countCategories(
        rows.map((r) => r.datasetsAnalysed),
        { explodeCsv: true, topN: 10 }
      ),
    [rows]
  );
  const aoiTypeCounts = useMemo(
    () => countCategories(rows.map((r) => r.aoiType), { topN: 10 }),
    [rows]
  );
  const aoiNames = useMemo(() => countAoiNames(rows, 30), [rows]);

  return (
    <Box>
      <Heading as="h3" size="md" mb={3}>
        GNW Analysis Usage
      </Heading>
      <Flex direction="column" gap={3}>
        <Expander title="ℹ️ Where does this data come from?">
          <Text fontSize="sm">
            These metrics are extracted from trace context metadata attached by the GNW
            agent. Only traces that reach the analysis stage will have dataset and AOI
            information populated.
          </Text>
        </Expander>
        <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
          {datasetCounts.length ? (
            <ChartCard
              title="Datasets analysed"
              help="Datasets referenced in successful analyses (from trace context)."
            >
              <DonutChart data={datasetCounts} />
            </ChartCard>
          ) : null}
          {aoiTypeCounts.length ? (
            <ChartCard
              title="AOI type"
              help="What kinds of areas users are analysing (e.g., country, admin region, drawn polygon)."
            >
              <DonutChart data={aoiTypeCounts} />
            </ChartCard>
          ) : null}
        </SimpleGrid>
        {aoiNames.length ? (
          <ChartCard
            title="AOI selection counts"
            help="Most commonly analysed places (AOIs) in this dataset, colored by dominant AOI type."
          >
            <HorizontalBarChart
              data={aoiNames.map((a) => ({
                label: a.label,
                count: a.count,
                category: a.aoiType,
              }))}
            />
          </ChartCard>
        ) : null}
      </Flex>
    </Box>
  );
}
