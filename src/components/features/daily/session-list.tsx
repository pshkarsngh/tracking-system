"use client";

import { NotebookPen } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackerLabel } from "@/config/trackers";
import type { DailySession } from "@/features/daily/server";
import { deleteSessionAction } from "@/features/daily/actions";
import { DeleteButton } from "@/components/shared/delete-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TRACKER_DOTS: Record<string, string> = {
  DSA: "bg-indigo-500",
  WEB_DEV: "bg-violet-500",
  AI_ML: "bg-fuchsia-500",
  ENGLISH: "bg-emerald-500",
  APTITUDE: "bg-amber-500",
  COLLEGE: "bg-sky-500",
  PROJECT: "bg-rose-500",
};

function timeOf(d: Date): string {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(d);
}

export function SessionList({ sessions }: { sessions: DailySession[] }) {
  return (
    <Card className="glass">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold">Logged sessions</CardTitle>
        <span className="rounded-full bg-accent/60 px-2 py-0.5 text-xs font-medium tabular-nums">
          {sessions.length} total · {sessions.reduce((s, x) => s + x.durationMin, 0)} min
        </span>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <NotebookPen className="size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No sessions logged yet today.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {sessions.map((s) => (
              <li key={s.id} className="flex items-center gap-3 py-2.5">
                <span className={cn("size-2.5 shrink-0 rounded-full", TRACKER_DOTS[s.trackerType] ?? "bg-muted")} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{s.topicName}</p>
                  <p className="text-xs text-muted-foreground">
                    {trackerLabel(s.trackerType)} · {timeOf(s.startedAt)}
                    {s.notes ? ` · ${s.notes}` : ""}
                  </p>
                </div>
                <span className="shrink-0 rounded-lg bg-accent/60 px-2 py-1 text-xs font-semibold tabular-nums">
                  {s.durationMin}m
                </span>
                <form action={deleteSessionAction}>
                  <input type="hidden" name="id" value={s.id} />
                  <DeleteButton confirmText="Delete this session?" />
                </form>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
