import type { Metadata } from "next";
import { Clock3, Sparkles, TrendingUp, Zap } from "lucide-react";
import { requireUser } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { getDailyData } from "@/features/daily/server";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { ScoreBar } from "@/components/shared/score-bar";
import { FocusTimer } from "@/components/features/daily/focus-timer";
import { SessionList } from "@/components/features/daily/session-list";

export const metadata: Metadata = { title: "Daily Planner" };
export const dynamic = "force-dynamic";

export default async function DailyPage() {
  const user = await requireUser();
  const [data, topics] = await Promise.all([
    getDailyData(user.id),
    prisma.topic.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, trackerType: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const vsYesterday = data.yesterdayMinutes > 0 ? Math.round((data.focusMinutes / data.yesterdayMinutes) * 100) : 100;

  return (
    <>
      <PageHeader
        title="Daily Planner"
        description={data.label}
        className="hidden lg:flex"
      />

      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Focus today"
            value={`${data.focusMinutes} min`}
            icon={Clock3}
            iconClassName="bg-indigo-500/15 text-indigo-400"
            trend={data.yesterdayMinutes > 0 ? { delta: vsYesterday - 100, label: "vs yesterday" } : undefined}
          />
          <StatCard
            label="Daily goal"
            value={`${data.goalMinutes} min`}
            icon={TrendingUp}
            iconClassName="bg-emerald-500/15 text-emerald-400"
          />
          <StatCard label="Sessions" value={data.sessionCount} icon={Sparkles} iconClassName="bg-amber-500/15 text-amber-400" />
          <StatCard label="XP earned" value={`+${data.xpEarned}`} icon={Zap} iconClassName="bg-violet-500/15 text-violet-400" />
        </div>

        <div className="glass rounded-2xl p-4">
          <ScoreBar
            label="Daily focus progress"
            value={data.goalMinutes > 0 ? Math.round((data.focusMinutes / data.goalMinutes) * 100) : 0}
            hint={`${data.focusMinutes} / ${data.goalMinutes} min`}
            color="violet"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <FocusTimer topicNames={topics} />
          </div>
          <SessionList sessions={data.sessions} />
        </div>
      </div>
    </>
  );
}
