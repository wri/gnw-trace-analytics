"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCount } from "@/lib/format";

export interface BarSeries {
  readonly key: string;
  readonly label: string;
  readonly color: string;
}

interface StackedBarsChartProps {
  readonly data: readonly Record<string, unknown>[];
  readonly series: readonly BarSeries[];
  readonly height?: number;
  readonly yLabel?: string;
}

/** Stacked daily bars (user-segment chart equivalent). */
export function StackedBarsChart({
  data,
  series,
  height = 220,
  yLabel,
}: StackedBarsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={[...data]}
        margin={{ top: 8, right: 16, bottom: 4, left: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#E1E2E6"
          vertical={false}
        />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis
          tick={{ fontSize: 11 }}
          width={44}
          label={
            yLabel
              ? {
                  value: yLabel,
                  angle: -90,
                  position: "insideLeft",
                  fontSize: 11,
                }
              : undefined
          }
        />
        <Tooltip
          formatter={(value: unknown, name: unknown) => [
            formatCount(Number(value)),
            String(name),
          ]}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {series.map((s) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            stackId="stack"
            fill={s.color}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
