"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { categoryColor } from "@/components/charts/palette";
import { formatCount } from "@/lib/format";

export interface HorizontalBarDatum {
  readonly label: string;
  readonly count: number;
  /** Optional category used for bar coloring (e.g. AOI type). */
  readonly category?: string | null;
}

interface HorizontalBarChartProps {
  readonly data: readonly HorizontalBarDatum[];
  readonly color?: string;
  readonly barHeight?: number;
}

/** Horizontal count bars (AOI names / top categories equivalent). */
export function HorizontalBarChart({
  data,
  color = "#0068C9",
  barHeight = 22,
}: HorizontalBarChartProps) {
  const height = Math.max(200, Math.min(800, data.length * barHeight + 40));
  const categories = [
    ...new Set(data.map((d) => d.category).filter(Boolean)),
  ] as string[];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={[...data]}
        layout="vertical"
        margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#E1E2E6"
          horizontal={false}
        />
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis
          type="category"
          dataKey="label"
          width={160}
          tick={{ fontSize: 11 }}
          interval={0}
        />
        <Tooltip
          formatter={(value: unknown) => [formatCount(Number(value)), "Count"]}
        />
        <Bar dataKey="count" isAnimationActive={false}>
          {data.map((entry) => (
            <Cell
              key={entry.label}
              fill={
                entry.category
                  ? categoryColor(categories.indexOf(entry.category))
                  : color
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
