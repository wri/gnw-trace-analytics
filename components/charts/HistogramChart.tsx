"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { HistogramBin } from "@/lib/analytics/stats";
import { formatCount } from "@/lib/format";

interface HistogramChartProps {
  readonly bins: readonly HistogramBin[];
  /** Formats bin edges for the axis/tooltip, e.g. $0.0100 or 1.5s. */
  readonly edgeFormatter?: (value: number) => string;
  readonly height?: number;
  readonly color?: string;
  readonly countLabel?: string;
}

function defaultEdgeFormatter(value: number): string {
  if (Number.isInteger(value)) return value.toLocaleString();
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/** Histogram over pre-computed bins (Altair transform_bin equivalent). */
export function HistogramChart({
  bins,
  edgeFormatter = defaultEdgeFormatter,
  height = 220,
  color = "#0068C9",
  countLabel = "Traces",
}: HistogramChartProps) {
  const data = bins.map((bin) => ({
    ...bin,
    label: `${edgeFormatter(bin.binStart)} – ${edgeFormatter(bin.binEnd)}`,
  }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 8, right: 8, bottom: 4, left: 0 }}
        barCategoryGap={1}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#E1E2E6"
          vertical={false}
        />
        <XAxis
          dataKey="binStart"
          tickFormatter={edgeFormatter}
          tick={{ fontSize: 10 }}
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fontSize: 11 }} width={44} />
        <Tooltip
          formatter={(value: unknown) => [
            formatCount(Number(value)),
            countLabel,
          ]}
          labelFormatter={(_, payload) => {
            const first = payload?.[0]?.payload as
              { label?: string } | undefined;
            return first?.label ?? "";
          }}
        />
        <Bar dataKey="count" fill={color} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}
