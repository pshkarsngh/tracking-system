import type { Metadata } from "next";
import { requireUser } from "@/lib/server/auth";
import { getGoalsData } from "@/features/goals/server";
import { PageHeader } from "@/components/shared/page-header";
import { GoalCard, DoneGoalCard, GoalDialog } from "@/components/features/goals/goal-card";
import { StatCard } from "@/components/shared/stat-card";
import { CheckCircle2, Flag, Sparkles, Target } from "lucide-react";

export const metadata: Metadata = { title: "Goals" };
export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const user = await requireUser();
  const data = await getGoalsData(user.id);

  return (
    <div>
      <PageHeader title="Goals" description="Big targets, broken into milestones. Every milestone = +150 XP.">
        <GoalDialog />
      </PageHeader>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active goals" value={data.stats.active} icon={Target} iconClassName="bg-indigo-500/15 text-indigo-400" />
        <StatCard label="Completed" value={data.stats.completed} icon={CheckCircle2} iconClassName="bg-emerald-500/15 text-emerald-400" />
        <StatCard label="Avg progress" value={`${data.stats.avgProgress}%`} icon={Flag} iconClassName="bg-amber-500/15 text-amber-400" />
        <StatCard label="XP from milestones" value={data.stats.xpFromGoals} icon={Sparkles} iconClassName="bg-violet-500/15 text-violet-400" />
      </div>

      {data.active.length === 0 ? (
        <div className="glass rounded-2xl border border-dashed p-12 text-center">
          <p className="font-heading text-lg font-semibold">No active goals</p>
          <p className="mt-1 text-sm text-muted-foreground">Set your first goal and start earning milestone XP.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.active.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}

      {data.done.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Completed & archived ({data.done.length})
          </h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.done.map((goal) => (
              <DoneGoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
