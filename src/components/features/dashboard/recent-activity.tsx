"use client";

import { useState } from "react";
import { Activity, Code2, Sparkles, Timer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TYPE_META = {
  session: { icon: Timer, color: "text-indigo-400 bg-indigo-500/10" },
  problem: { icon: Code2, color: "text-emerald-400 bg-emerald-500/10" },
  badge: { icon: Sparkles, color: "text-amber-400 bg-amber-500/10" },
} as const;

interface ActivityItem {
  id: string;
  type: string;
  label: string;
  sublabel: string;
  at: Date;
}

export function RecentActivity({ activities }: { activities: ActivityItem[] }) {
  // Capture a stable reference time so "time ago" labels don't shift on re-render.
  const [now] = useState(() => Date.now());
  if (activities.length === 0) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Your latest wins will appear here.</p>
        </CardContent>
      </Card>
    );
  }

  const timeAgo = (d: Date) => {
    const diff = now - d.getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 60) return `${Math.max(1, mins)}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <Card className="glass">
      <CardHeader className="flex-row items-center gap-2 space-y-0 pb-2">
        <Activity className="size-4 text-muted-foreground" />
        <CardTitle className="text-sm font-semibold">Recent activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1">
          {activities.map((a) => {
            const meta = TYPE_META[a.type as keyof typeof TYPE_META] ?? TYPE_META.session;
            const Icon = meta.icon;
            return (
              <li key={a.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-accent/50">
                <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${meta.color}`}>
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{a.label}</p>
                  <p className="text-xs text-muted-foreground">{a.sublabel}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(a.at)}</span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
