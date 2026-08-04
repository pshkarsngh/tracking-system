import type { Metadata } from "next";
import { CheckCircle2, Flame, Repeat } from "lucide-react";
import { requireUser } from "@/lib/server/auth";
import { getHabitsData } from "@/features/habits/server";
import type { HabitWithData } from "@/features/habits/types";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { NewHabitDialog } from "@/components/features/habits/new-habit-dialog";
import { HabitCard } from "@/components/features/habits/habit-card";

export const metadata: Metadata = { title: "Habits" };
export const dynamic = "force-dynamic";

export default async function HabitsPage() {
  const user = await requireUser();
  const data = await getHabitsData(user.id);

  const avgStreak =
    data.habits.length > 0 ? Math.round(data.habits.reduce((s: number, h: HabitWithData) => s + h.currentStreak, 0) / data.habits.length) : 0;

  return (
    <>
      <PageHeader title="Habits" description="Small daily actions, compounded into who you become.">
        <NewHabitDialog />
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Active habits" value={data.activeCount} icon={Repeat} iconClassName="bg-indigo-500/15 text-indigo-400" />
        <StatCard
          label="Done today"
          value={`${data.doneTodayCount}/${data.activeCount}`}
          icon={CheckCircle2}
          iconClassName="bg-emerald-500/15 text-emerald-400"
        />
        <StatCard label="Avg streak" value={`${avgStreak} days`} icon={Flame} iconClassName="bg-orange-500/15 text-orange-400" />
      </div>

      {data.habits.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="No habits yet"
          description="Habits are the engine of your streak. Create one to start earning daily XP."
          action={<NewHabitDialog />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.habits.map((habit: HabitWithData) => (
            <HabitCard key={habit.id} habit={habit} />
          ))}
        </div>
      )}
    </>
  );
}
