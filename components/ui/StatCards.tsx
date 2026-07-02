"use client";

import { Box, SimpleGrid, Text } from "@chakra-ui/react";

export interface StatItem {
  readonly label: string;
  readonly value: string;
  readonly hint?: string;
}

interface StatCardsProps {
  readonly items: readonly StatItem[];
  readonly columns?: number;
}

/** Compact metric tiles (Streamlit st.metric equivalent). */
export function StatCards({ items, columns }: StatCardsProps) {
  return (
    <SimpleGrid columns={{ base: 2, md: columns ?? Math.min(items.length, 5) }} gap={3}>
      {items.map((item) => (
        <Box
          key={item.label}
          bg="bg.subtle"
          borderRadius="md"
          px={3}
          py={2}
          minW={0}
        >
          <Text fontSize="xs" color="fg.muted" lineClamp={1}>
            {item.label}
          </Text>
          <Text fontSize="md" fontWeight="semibold" lineClamp={1}>
            {item.value}
          </Text>
          {item.hint ? (
            <Text fontSize="xs" color="fg.subtle" lineClamp={1}>
              {item.hint}
            </Text>
          ) : null}
        </Box>
      ))}
    </SimpleGrid>
  );
}
