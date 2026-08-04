"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const GRADIENT_ID = "xpAreaGradient";

export function XpTrendChart({ data }: { data: { key: string; xp: number }[] }) {
  const label = (key: string) => {
    const [, m, d] = key.split("-");
    return `${Number(m)}/${Number(d)}`;
  };

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">XP · last 30 days</CardTitle>
      </CardHeader>
      <CardContent className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id={GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} vertical={false} />
            <XAxis
              dataKey="key"
              tickFormatter={label}
              tick={{ fontSize: 11, fill: "currentColor", opacity: 0.6 }}
              tickLine={false}
              axisLine={false}
              interval={4}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "currentColor", opacity: 0.6 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              labelFormatter={(_, payload) => (payload?.[0]?.payload as { key: string } | undefined)?.key ?? ""}
              formatter={(value) => [`${value} XP`, "Earned"]}
              contentStyle={{
                background: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 12,
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="xp"
              stroke="#6366f1"
              strokeWidth={2}
              fill={`url(#${GRADIENT_ID})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

const TRACKER_COLORS: Record<string, string> = {
  DSA: "#6366f1",
  WEB_DEV: "#8b5cf6",
  AI_ML: "#a855f7",
  ENGLISH: "#10b981",
  APTITUDE: "#f59e0b",
  COLLEGE: "#0ea5e9",
  PROJECT: "#f43f5e",
};

export function TrackerTimeChart({ data }: { data: { tracker: string; minutes: number }[] }) {
  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Focus by tracker · 30 days</CardTitle>
      </CardHeader>
      <CardContent className="h-56">
        {data.length === 0 ? (
          <p className="grid h-full place-items-center text-sm text-muted-foreground">No sessions logged yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "currentColor", opacity: 0.6 }} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="tracker"
                width={80}
                tick={{ fontSize: 11, fill: "currentColor", opacity: 0.75 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value) => [`${value} min`, "Focus"]}
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="minutes" radius={[0, 6, 6, 0]} barSize={14}>
                {data.map((entry) => (
                  <Cell key={entry.tracker} fill={TRACKER_COLORS[entry.tracker] ?? "#6366f1"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
