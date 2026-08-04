import type { Metadata } from "next";
import { requireUser } from "@/lib/server/auth";
import { getAnalyticsData, XP_SOURCE_LABEL } from "@/features/analytics/server";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { XpTrendChart, TrackerTimeChart } from "@/components/features/dashboard/charts";
import { XpSourceDonut, XpSourceLegend } from "@/components/features/analytics/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Flame, Puzzle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Analytics" };
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  SOLVED: "Solved",
  ATTEMPTED: "Attempted",
  TODO: "To do",
};

const APP_LABEL: Record<string, string> = {
  APPLIED: "Applied",
  SCREENING: "Screening",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

const APP_COLORS: Record<string, string> = {
  APPLIED: "bg-sky-500",
  SCREENING: "bg-indigo-500",
  INTERVIEW: "bg-amber-500",
  OFFER: "bg-emerald-500",
  REJECTED: "bg-rose-500",
  WITHDRAWN: "bg-muted-foreground",
};

function HBar({
  items,
  labelMap,
  colorMap,
  max,
}: {
  items: { key: string; value: number }[];
  labelMap: Record<string, string>;
  colorMap: Record<string, string>;
  max: number;
}) {
  return (
    <div className="space-y-2.5">
      {items.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No data yet.</p>}
      {items.map((item) => (
        <div key={item.key} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{labelMap[item.key] ?? item.key}</span>
            <span className="font-semibold tabular-nums">{item.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-accent/60">
            <div
              className={cn("h-full rounded-full", colorMap[item.key] ?? "bg-primary")}
              style={{ width: `${max > 0 ? (item.value / max) * 100 : 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function AnalyticsPage() {
  const user = await requireUser();
  const data = await getAnalyticsData(user.id);

  const maxStatus = Math.max(1, ...data.problemsByStatus.map((p) => p.count));
  const maxApp = Math.max(1, ...data.applicationsByStatus.map((a) => a.count));

  return (
    <div>
      <PageHeader title="Analytics" description="Last 30 days of your Momentum journey — see what&apos;s compounding." />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Focus time" value={`${data.totals.focusMinutes} min`} icon={Clock} iconClassName="bg-indigo-500/15 text-indigo-400" />
        <StatCard label="XP earned" value={data.totals.xp} icon={Sparkles} iconClassName="bg-amber-500/15 text-amber-400" />
        <StatCard label="Problems solved" value={data.totals.problemsSolved} icon={Puzzle} iconClassName="bg-violet-500/15 text-violet-400" />
        <StatCard label="Active days" value={`${data.activeDays}/30`} icon={Flame} iconClassName="bg-rose-500/15 text-rose-400" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <XpTrendChart data={data.xpByDay} />
        <TrackerTimeChart data={data.minutesByTracker} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Problems solved by difficulty</CardTitle>
          </CardHeader>
          <CardContent>
            <HBar
              items={data.problemsByDifficulty.map((p) => ({ key: p.difficulty, value: p.solved }))}
              labelMap={{ EASY: "Easy", MEDIUM: "Medium", HARD: "Hard" }}
              colorMap={{ EASY: "bg-emerald-500", MEDIUM: "bg-amber-500", HARD: "bg-rose-500" }}
              max={Math.max(1, ...data.problemsByDifficulty.map((p) => p.solved))}
            />
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Problem backlog</CardTitle>
          </CardHeader>
          <CardContent>
            <HBar
              items={data.problemsByStatus.map((p) => ({ key: p.status, value: p.count }))}
              labelMap={STATUS_LABEL}
              colorMap={{ SOLVED: "bg-emerald-500", ATTEMPTED: "bg-amber-500", TODO: "bg-sky-500" }}
              max={maxStatus}
            />
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Application pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <HBar
              items={data.applicationsByStatus.map((a) => ({ key: a.status, value: a.count }))}
              labelMap={APP_LABEL}
              colorMap={APP_COLORS}
              max={maxApp}
            />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <XpSourceDonut data={data.xpBySource} labels={XP_SOURCE_LABEL} />
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">XP breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <XpSourceLegend data={data.xpBySource} labels={XP_SOURCE_LABEL} />
            <p className="mt-4 text-xs text-muted-foreground">
              Best day: <span className="font-semibold text-foreground">{data.bestDayXp.xp} XP</span> on {data.bestDayXp.key || "—"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
