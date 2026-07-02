"use client";

import { Badge, Box, Flex, Text } from "@chakra-ui/react";
import { ArrowDownRightIcon, ArrowUpRightIcon, MinusIcon } from "@phosphor-icons/react";
import type { KpiDelta } from "@/lib/analytics/compare";

interface KpiCardProps {
  readonly label: string;
  readonly value: string;
  /** Delta vs the previous period; null hides the badge. */
  readonly delta: KpiDelta | null;
  readonly hint?: string;
}

/** Headline KPI tile with a period-over-period delta badge. */
export function KpiCard({ label, value, delta, hint }: KpiCardProps) {
  return (
    <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="lg" p={4} minW={0}>
      <Text fontSize="xs" color="fg.muted" mb={1} lineClamp={1}>
        {label}
      </Text>
      <Flex align="baseline" gap={2} wrap="wrap">
        <Text fontSize="2xl" fontWeight="bold" lineHeight="short">
          {value}
        </Text>
        {delta ? (
          <Badge
            colorPalette={
              delta.direction === "flat" ? "gray" : delta.positive ? "green" : "red"
            }
            variant="subtle"
            fontSize="2xs"
          >
            {delta.direction === "up" ? (
              <ArrowUpRightIcon />
            ) : delta.direction === "down" ? (
              <ArrowDownRightIcon />
            ) : (
              <MinusIcon />
            )}
            {delta.text}
          </Badge>
        ) : null}
      </Flex>
      {hint ? (
        <Text fontSize="xs" color="fg.subtle" mt={1} lineClamp={1}>
          {hint}
        </Text>
      ) : null}
    </Box>
  );
}
