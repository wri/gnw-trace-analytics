"use client";

import { ReactNode } from "react";
import { Box, Heading, Text } from "@chakra-ui/react";

interface ChartCardProps {
  readonly title: string;
  readonly help?: string;
  readonly children: ReactNode;
}

/** Panel wrapper giving every chart a consistent GNW-styled frame. */
export function ChartCard({ title, help, children }: ChartCardProps) {
  return (
    <Box
      bg="bg.panel"
      borderWidth="1px"
      borderColor="border"
      borderRadius="lg"
      p={4}
      minW={0}
    >
      <Heading as="h4" size="sm" mb={help ? 0.5 : 3}>
        {title}
      </Heading>
      {help ? (
        <Text fontSize="xs" color="fg.muted" mb={3}>
          {help}
        </Text>
      ) : null}
      {children}
    </Box>
  );
}
