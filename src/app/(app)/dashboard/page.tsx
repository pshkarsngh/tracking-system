import type { Metadata } from "next";
import { requireUser } from "@/lib/server/auth";
import { getDashboardData } from "@/features/dashboard/server";
import { PageHeader } from "@/components/shared/page-header";
import { WelcomeBanner } from "@/components/features/dashboard/welcome-banner";
import { FocusCard } from "@/components/features/dashboard/focus-card";
import { HabitChecklist } from "@/components/features/dashboard/habit-checklist";
import { XpTrendChart, TrackerTimeChart } from "@/components/features/dashboard/charts";
import { HeatmapCard } from "@/components/features/dashboard/heatmap-card";
import { ScoresCard } from "@/components/features/dashboard/scores-card";
import { RecentActivity } from "@/components/features/dashboard/recent-activity";
import { UpcomingCard } from "@/components/features/dashboard/upcoming-card";

export const metadata: Metadata = { title: "Dashboard" };

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getDashboardData(user.id);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Your mission control for today"
        className="hidden lg:block"
      />

      <div className="space-y-6">
        <WelcomeBanner
          name={data.user.name}
          dateLabel={data.today.label}
          streak={data.user.currentStreak}
          xpToday={data.today.xpEarned}
          levelTitle={data.user.levelTitle}
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <FocusCard
              todayMinutes={data.today.focusMinutes}
              dailyGoal={data.user.dailyGoalMinutes}
              weekMinutes={data.week.focusMinutes}
              weekGoal={data.user.weeklyGoalMinutes}
            />
            <HabitChecklist habits={data.habits} />
            <XpTrendChart data={data.charts.xpByDay} />
            <TrackerTimeChart data={data.charts.minutesByTracker} />
            <HeatmapCard data={data.heatmap} streak={data.user.currentStreak} />
          </div>

          <div className="space-y-6">
            <ScoresCard
              scores={[
                { label: "Consistency", value: data.week.consistency, hint: `${data.week.activeDays}/7 days` },
                { label: "Discipline", value: data.week.discipline, hint: "plan vs actual" },
                { label: "Productivity", value: data.week.productivity, hint: "30d XP pace" },
              ]}
            />
            <RecentActivity activities={data.recentActivity} />
            <UpcomingCard
              collegeTasks={data.upcoming.collegeTasks}
              interviews={data.upcoming.interviews}
              goalDeadlines={data.upcoming.goalDeadlines}
            />
          </div>
        </div>
      </div>
    </>
  );
}
