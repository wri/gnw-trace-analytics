"use client";

import {
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { OUTCOME_COLORS, OUTCOME_LABELS } from "@/components/charts/palette";
import { categoryColor } from "@/components/charts/palette";

interface ScatterPoint {
  readonly toolCallCount: number;
  readonly latencySeconds: number;
  readonly outcome: string;
}

interface ToolCallsScatterChartProps {
  readonly data: readonly ScatterPoint[];
  readonly height?: number;
}

/** Tool calls per trace vs latency, colored by outcome. */
export function ToolCallsScatterChart({
  data,
  height = 280,
}: ToolCallsScatterChartProps) {
  const byOutcome = new Map<string, ScatterPoint[]>();
  for (const point of data) {
    const label = OUTCOME_LABELS[point.outcome] ?? point.outcome;
    const bucket = byOutcome.get(label) ?? [];
    bucket.push(point);
    byOutcome.set(label, bucket);
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E1E2E6" />
        <XAxis
          type="number"
          dataKey="toolCallCount"
          name="Tool calls"
          tick={{ fontSize: 11 }}
          label={{
            value: "Tool calls per trace",
            position: "insideBottom",
            offset: -4,
            fontSize: 11,
          }}
        />
        <YAxis
          type="number"
          dataKey="latencySeconds"
          name="Latency (s)"
          tick={{ fontSize: 11 }}
          width={48}
        />
        <Tooltip
          cursor={{ strokeDasharray: "3 3" }}
          formatter={(value: unknown, name: unknown) => [
            String(name) === "Latency (s)"
              ? `${Number(value).toFixed(2)}s`
              : String(value),
            String(name),
          ]}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {[...byOutcome.entries()].map(([label, points], i) => (
          <Scatter
            key={label}
            name={label}
            data={points.map((p) => ({ ...p }))}
            fill={OUTCOME_COLORS[label] ?? categoryColor(i)}
            fillOpacity={0.6}
            isAnimationActive={false}
          />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );
}
