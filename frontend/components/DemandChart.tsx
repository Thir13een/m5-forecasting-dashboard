"use client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from "recharts";
import type { ForecastItem } from "@/lib/types";
import { fmt } from "@/lib/utils";

interface Props {
  forecast: ForecastItem;
  reorderPoint?: number;
}

export default function DemandChart({ forecast, reorderPoint }: Props) {
  const data = [
    { label: "Day 1",  value: forecast.pred_h01 },
    { label: "Day 7",  value: forecast.pred_h07 },
    { label: "Day 14", value: forecast.pred_h14 },
    { label: "Day 28", value: forecast.pred_h28 },
  ];

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} width={35} />
        <Tooltip
          formatter={(v: number) => [fmt(v, 1) + " units", "Forecast"]}
          contentStyle={{ fontSize: 12 }}
        />
        {reorderPoint && (
          <ReferenceLine
            y={reorderPoint}
            stroke="#ef4444"
            strokeDasharray="4 4"
            label={{ value: "Reorder point", fontSize: 10, fill: "#ef4444" }}
          />
        )}
        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
