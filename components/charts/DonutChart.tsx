"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { LabelCount } from "@/lib/analytics/aggregations";
import { categoryColor } from "@/components/charts/palette";
import { formatCount } from "@/lib/format";

interface DonutChartProps {
  readonly data: readonly LabelCount[];
  /** Explicit label → color map; falls back to the categorical palette. */
  readonly colors?: Readonly<Record<string, string>>;
  readonly height?: number;
}

/** Donut chart with count + percent tooltips (Altair mark_arc equivalent). */
export function DonutChart({ data, colors, height = 250 }: DonutChartProps) {
  const visible = data.filter((d) => d.count > 0);
  const total = Math.max(
    1,
    visible.reduce((acc, d) => acc + d.count, 0),
  );
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={visible.map((d) => ({ ...d }))}
          dataKey="count"
          nameKey="label"
          innerRadius="55%"
          outerRadius="85%"
          stroke="#fff"
          isAnimationActive={false}
        >
          {visible.map((entry, i) => (
            <Cell
              key={entry.label}
              fill={colors?.[entry.label] ?? categoryColor(i)}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: unknown, name: unknown) => [
            `${formatCount(Number(value))} (${((Number(value) / total) * 100).toFixed(1)}%)`,
            String(name),
          ]}
        />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          wrapperStyle={{ fontSize: 12 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
