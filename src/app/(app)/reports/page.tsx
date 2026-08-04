import type { Metadata } from "next";
import { requireUser } from "@/lib/server/auth";
import { getAnalyticsData, XP_SOURCE_LABEL } from "@/features/analytics/server";
import { PageHeader } from "@/components/shared/page-header";
import { XpSourceLegend } from "@/components/features/analytics/charts";
import { ReadinessCard } from "@/components/features/placement/readiness-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileBarChart, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const user = await requireUser();
  const data = await getAnalyticsData(user.id);

  const lastTwo = data.weekly.filter((w) => w.xp > 0 || w.focusMinutes > 0).slice(-2);
  const trend = lastTwo.length === 2 ? lastTwo[1].xp - lastTwo[0].xp : 0;

  return (
    <div>
      <PageHeader
        title="Reports"
        description="A snapshot you can actually read — weekly cadence, effort mix, and readiness at a glance."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          <Card className="glass">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <FileBarChart className="size-4 text-indigo-400" /> Weekly cadence · last 8 weeks
              </CardTitle>
              {trend !== 0 && (
                <span className={cn("flex items-center gap-1 text-xs font-semibold", trend > 0 ? "text-emerald-500" : "text-rose-500")}>
                  {trend > 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                  {trend > 0 ? "+" : ""}
                  {trend} XP vs last week
                </span>
              )}
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="py-2 pr-3">Week of</th>
                      <th className="py-2 pr-3">Focus</th>
                      <th className="py-2 pr-3">XP</th>
                      <th className="py-2 pr-3">Active days</th>
                      <th className="py-2 pr-3">Problems</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.weekly.map((w) => (
                      <tr key={w.weekKey} className="border-b border-border/40 last:border-0">
                        <td className="py-2 pr-3 font-medium">{w.label}</td>
                        <td className="py-2 pr-3 tabular-nums text-muted-foreground">
                          {w.focusMinutes > 0 ? `${w.focusMinutes} min` : "—"}
                        </td>
                        <td className="py-2 pr-3">
                          <span className={cn("tabular-nums font-semibold", w.xp > 0 ? "text-amber-500" : "text-muted-foreground/50")}>
                            {w.xp > 0 ? `+${w.xp}` : "—"}
                          </span>
                        </td>
                        <td className="py-2 pr-3 tabular-nums text-muted-foreground">{w.habitsDone > 0 ? w.habitsDone : "—"}</td>
                        <td className="py-2 pr-3 tabular-nums text-muted-foreground">{w.problemsSolved > 0 ? w.problemsSolved : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Effort mix · 30 days</CardTitle>
              </CardHeader>
              <CardContent>
                <XpSourceLegend data={data.xpBySource} labels={XP_SOURCE_LABEL} />
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Period totals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 text-sm">
                {[
                  { label: "Focus sessions", value: data.totals.sessions },
                  { label: "Speaking practice", value: `${data.totals.speakingMinutes} min` },
                  { label: "Mock interviews", value: data.totals.interviews },
                  { label: "Habit days hit", value: data.totals.habitsDone },
                  { label: "Best single day", value: `${data.bestDayXp.xp} XP` },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-semibold tabular-nums">{row.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <ReadinessCard readiness={data.readiness} />
        </aside>
      </div>
    </div>
  );
}
