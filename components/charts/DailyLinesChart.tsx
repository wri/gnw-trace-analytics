"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface LineSeries {
  readonly key: string;
  readonly label: string;
  readonly color: string;
}

interface DailyLinesChartProps {
  readonly data: readonly Record<string, unknown>[];
  readonly series: readonly LineSeries[];
  readonly yLabel?: string;
  readonly height?: number;
  readonly valueFormatter?: (value: number) => string;
  /** Optional horizontal reference line (e.g. the daily prompt limit). */
  readonly referenceY?: number;
}

/** Multi-series daily line chart (Altair mark_line equivalent). */
export function DailyLinesChart({
  data,
  series,
  yLabel,
  height = 260,
  valueFormatter,
  referenceY,
}: DailyLinesChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={[...data]}
        margin={{ top: 8, right: 16, bottom: 4, left: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#E1E2E6" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis
          tick={{ fontSize: 11 }}
          width={48}
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
            valueFormatter
              ? valueFormatter(Number(value))
              : Number(value).toLocaleString(),
            String(name),
          ]}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color}
            strokeWidth={2}
            dot={{ r: 2.5 }}
            isAnimationActive={false}
          />
        ))}
        {referenceY !== undefined ? (
          <ReferenceLine
            y={referenceY}
            stroke="#e5484d"
            strokeDasharray="6 4"
          />
        ) : null}
      </LineChart>
    </ResponsiveContainer>
  );
}
