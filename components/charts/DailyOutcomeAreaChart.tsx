"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyMetrics } from "@/lib/analytics/daily";
import {
  OUTCOME_COLORS,
  OUTCOME_STACK_ORDER,
} from "@/components/charts/palette";

interface DailyOutcomeAreaChartProps {
  readonly data: readonly DailyMetrics[];
  readonly height?: number;
}

const SERIES: readonly { key: keyof DailyMetrics; label: string }[] = [
  { key: "errorRate", label: "Error" },
  { key: "emptyRate", label: "Error (Empty)" },
  { key: "deferRate", label: "Defer" },
  { key: "softErrorRate", label: "Soft error" },
  { key: "successRate", label: "Success" },
];

/** Normalized stacked area of daily outcome rates. */
export function DailyOutcomeAreaChart({
  data,
  height = 260,
}: DailyOutcomeAreaChartProps) {
  const ordered = OUTCOME_STACK_ORDER.map(
    (label) => SERIES.find((s) => s.label === label) as (typeof SERIES)[number],
  );
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={[...data]}
        stackOffset="expand"
        margin={{ top: 8, right: 16, bottom: 4, left: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#E1E2E6" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis
          tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
          tick={{ fontSize: 11 }}
          width={44}
        />
        <Tooltip
          formatter={(value: unknown, name: unknown) => [
            `${(Number(value) * 100).toFixed(1)}%`,
            String(name),
          ]}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {ordered.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stackId="outcomes"
            stroke={OUTCOME_COLORS[s.label]}
            fill={OUTCOME_COLORS[s.label]}
            fillOpacity={0.85}
            isAnimationActive={false}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
