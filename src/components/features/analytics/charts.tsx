"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SOURCE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#0ea5e9", "#f43f5e", "#a855f7", "#64748b"];

export function XpSourceDonut({ data, labels }: { data: { source: string; xp: number }[]; labels: Record<string, string> }) {
  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">XP by source · 30 days</CardTitle>
      </CardHeader>
      <CardContent className="h-56">
        {data.length === 0 ? (
          <p className="grid h-full place-items-center text-sm text-muted-foreground">No XP earned yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="xp" nameKey="source" innerRadius={45} outerRadius={75} paddingAngle={3} strokeWidth={0}>
                {data.map((entry, i) => (
                  <Cell key={entry.source} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${value} XP`, labels[name as string] ?? name]}
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function XpSourceLegend({ data, labels }: { data: { source: string; xp: number }[]; labels: Record<string, string> }) {
  if (data.length === 0) return null;
  return (
    <ul className="space-y-1.5">
      {data.map((d, i) => (
        <li key={d.source} className="flex items-center gap-2 text-sm">
          <span className="size-2.5 rounded-full" style={{ background: SOURCE_COLORS[i % SOURCE_COLORS.length] }} />
          <span className="flex-1 text-muted-foreground">{labels[d.source] ?? d.source}</span>
          <span className="font-semibold tabular-nums">{d.xp}</span>
        </li>
      ))}
    </ul>
  );
}
