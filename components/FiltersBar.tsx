"use client";

/** Shared date-range / environment filter controls (tracey sidebar port). */

import { Box, Checkbox, Flex, Input, NativeSelect, Text } from "@chakra-ui/react";
import { ENVIRONMENT_OPTIONS, type EnvironmentOption } from "@/lib/config";
import { DATE_PRESETS, useFiltersStore, type DatePreset } from "@/stores/filtersStore";

interface FiltersBarProps {
  readonly showExcludeInternal?: boolean;
}

export function FiltersBar({ showExcludeInternal = true }: FiltersBarProps) {
  const {
    preset,
    startDate,
    endDate,
    environment,
    excludeInternal,
    setPreset,
    setCustomRange,
    setEnvironment,
    setExcludeInternal,
  } = useFiltersStore();

  return (
    <Flex gap={4} wrap="wrap" align="flex-end">
      <Box>
        <Text fontSize="xs" color="fg.muted" mb={1}>
          Date preset
        </Text>
        <NativeSelect.Root size="sm" width="150px">
          <NativeSelect.Field
            value={preset}
            onChange={(e) => setPreset(e.currentTarget.value as DatePreset)}
          >
            {DATE_PRESETS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </Box>

      <Box>
        <Text fontSize="xs" color="fg.muted" mb={1}>
          Start date
        </Text>
        <Input
          size="sm"
          type="date"
          width="150px"
          value={startDate}
          max={endDate}
          onChange={(e) => setCustomRange(e.currentTarget.value, endDate)}
        />
      </Box>

      <Box>
        <Text fontSize="xs" color="fg.muted" mb={1}>
          End date
        </Text>
        <Input
          size="sm"
          type="date"
          width="150px"
          value={endDate}
          min={startDate}
          onChange={(e) => setCustomRange(startDate, e.currentTarget.value)}
        />
      </Box>

      <Box>
        <Text fontSize="xs" color="fg.muted" mb={1}>
          Environment
        </Text>
        <NativeSelect.Root size="sm" width="140px">
          <NativeSelect.Field
            value={environment}
            onChange={(e) =>
              setEnvironment(e.currentTarget.value as EnvironmentOption)
            }
          >
            {ENVIRONMENT_OPTIONS.map((env) => (
              <option key={env} value={env}>
                {env}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </Box>

      {showExcludeInternal ? (
        <Checkbox.Root
          size="sm"
          checked={excludeInternal}
          onCheckedChange={(e) => setExcludeInternal(!!e.checked)}
          pb={1}
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control />
          <Checkbox.Label>Exclude internal users</Checkbox.Label>
        </Checkbox.Root>
      ) : null}
    </Flex>
  );
}
