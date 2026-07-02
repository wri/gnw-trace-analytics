"use client";

/** Shared fetch filters (date window, environment, internal-user exclusion). */

import { create } from "zustand";
import type { EnvironmentOption } from "@/lib/config";
import { shiftIsoDate, todayIso } from "@/lib/format";

export const DATE_PRESETS = [
  "Custom",
  "Last day",
  "Last 3 days",
  "Last week",
  "Last 2 weeks",
  "Last month",
] as const;

export type DatePreset = (typeof DATE_PRESETS)[number];

const PRESET_DAYS: Readonly<Record<Exclude<DatePreset, "Custom">, number>> = {
  "Last day": 1,
  "Last 3 days": 3,
  "Last week": 7,
  "Last 2 weeks": 14,
  "Last month": 30,
};

export function presetRange(preset: Exclude<DatePreset, "Custom">): {
  startDate: string;
  endDate: string;
} {
  const endDate = todayIso();
  return { startDate: shiftIsoDate(endDate, -PRESET_DAYS[preset]), endDate };
}

interface FiltersState {
  readonly preset: DatePreset;
  readonly startDate: string;
  readonly endDate: string;
  readonly environment: EnvironmentOption;
  readonly excludeInternal: boolean;
  readonly setPreset: (preset: DatePreset) => void;
  readonly setCustomRange: (startDate: string, endDate: string) => void;
  readonly setEnvironment: (environment: EnvironmentOption) => void;
  readonly setExcludeInternal: (exclude: boolean) => void;
}

const initialRange = presetRange("Last week");

export const useFiltersStore = create<FiltersState>()((set) => ({
  preset: "Last week",
  startDate: initialRange.startDate,
  endDate: initialRange.endDate,
  environment: "production",
  excludeInternal: true,
  setPreset: (preset) => {
    if (preset === "Custom") {
      set({ preset });
      return;
    }
    set({ preset, ...presetRange(preset) });
  },
  setCustomRange: (startDate, endDate) =>
    set({ preset: "Custom", startDate, endDate }),
  setEnvironment: (environment) => set({ environment }),
  setExcludeInternal: (excludeInternal) => set({ excludeInternal }),
}));
