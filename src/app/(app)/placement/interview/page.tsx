import type { Metadata } from "next";
import { requireUser } from "@/lib/server/auth";
import { getInterviewData } from "@/features/placement/server";
import { PageHeader } from "@/components/shared/page-header";
import { InterviewList } from "@/components/features/placement/interview-list";
import { StatCard } from "@/components/shared/stat-card";
import { Clock, Gauge, Mic } from "lucide-react";

export const metadata: Metadata = { title: "Mock Interviews" };
export const dynamic = "force-dynamic";

export default async function InterviewPage() {
  const user = await requireUser();
  const data = await getInterviewData(user.id);

  return (
    <div>
      <PageHeader
        title="Mock Interviews"
        description="Practice makes placement. Log every mock interview to build readiness and earn 150 XP each."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="Interviews" value={data.interviews.length} icon={Mic} iconClassName="bg-rose-500/15 text-rose-400" />
        <StatCard label="Practice time" value={`${data.totalMin} min`} icon={Clock} iconClassName="bg-sky-500/15 text-sky-400" />
        <StatCard label="Avg self rating" value={data.interviews.length ? `${data.avgRating}/10` : "—"} icon={Gauge} iconClassName="bg-emerald-500/15 text-emerald-400" />
      </div>

      <InterviewList interviews={data.interviews} />
    </div>
  );
}
