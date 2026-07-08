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

const INK = "#0f1b2d";
const INK_SOFT = "#47576e";
const AMBER = "#f0a830";
const LINE = "#ddd5c4";

export function AlertsChart({
  data,
}: {
  data: Array<{ day: string; alerts: number }>;
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid stroke={LINE} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: INK_SOFT }}
            tickLine={false}
            axisLine={{ stroke: LINE }}
            interval={4}
          />
          <YAxis
            tick={{ fontSize: 11, fill: INK_SOFT }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(240,168,48,0.12)" }}
            contentStyle={{
              borderRadius: 8,
              border: `1px solid ${LINE}`,
              fontSize: 12,
            }}
          />
          <Bar dataKey="alerts" fill={AMBER} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StockChart({
  data,
}: {
  data: Array<{ name: string; qty: number; threshold: number }>;
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 16, left: 40, bottom: 0 }}
        >
          <CartesianGrid stroke={LINE} strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: INK_SOFT }}
            tickLine={false}
            axisLine={{ stroke: LINE }}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={140}
            tick={{ fontSize: 11, fill: INK }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(240,168,48,0.12)" }}
            contentStyle={{
              borderRadius: 8,
              border: `1px solid ${LINE}`,
              fontSize: 12,
            }}
          />
          <Bar dataKey="qty" name="in stock" fill={AMBER} radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
