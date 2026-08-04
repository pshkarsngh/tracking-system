import { BookOpen, Clock3, Flame, Zap } from "lucide-react";
import { TRACKER_META, type TrackerTypeValue } from "@/config/trackers";
import type { TrackerData } from "@/features/trackers/server";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TopicSection } from "@/components/features/trackers/topic-section";
import { ProblemSection } from "@/components/features/trackers/problem-section";
import { ProjectSection } from "@/components/features/trackers/project-section";
import { SpeakingSection } from "@/components/features/trackers/speaking-section";
import { AptitudeSection } from "@/components/features/trackers/aptitude-section";
import { CollegeSection } from "@/components/features/trackers/college-section";
import { trackerLabel } from "@/config/trackers";

const DESCRIPTIONS: Record<TrackerTypeValue, string> = {
  DSA: "Problems, patterns, and the grind — one solved problem at a time.",
  WEB_DEV: "Build the web. Topics + shipped projects.",
  AI_ML: "Models, math, and machine learning practice.",
  ENGLISH: "Speaking practice and communication confidence.",
  APTITUDE: "Quantitative, logical, and verbal reasoning reps.",
  COLLEGE: "Assignments, attendance, exams — stay on top of academics.",
  PROJECT: "Major projects that become your portfolio.",
};

export function TrackerPage({ data }: { data: TrackerData }) {
  const meta = TRACKER_META[data.trackerType];

  return (
    <>
      <PageHeader title={meta.label} description={DESCRIPTIONS[data.trackerType]} />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total focus" value={`${data.stats.totalMinutes} min`} icon={Clock3} iconClassName="bg-indigo-500/15 text-indigo-400" />
        <StatCard label="Sessions" value={data.stats.totalSessions} icon={Zap} iconClassName="bg-violet-500/15 text-violet-400" />
        <StatCard label="Active topics" value={data.stats.activeTopics} icon={BookOpen} iconClassName="bg-emerald-500/15 text-emerald-400" />
        <StatCard label="Recent streak" value={`${data.stats.streak} days`} icon={Flame} iconClassName="bg-orange-500/15 text-orange-400" />
      </div>

      <div className="space-y-6">
        {data.trackerType !== "COLLEGE" && data.trackerType !== "PROJECT" && (
          <TopicSection topics={data.topics} trackerType={data.trackerType} />
        )}

        {data.trackerType === "DSA" && <ProblemSection problems={data.problems} topics={data.topics} />}
        {(data.trackerType === "WEB_DEV" || data.trackerType === "AI_ML" || data.trackerType === "PROJECT") && (
          <ProjectSection projects={data.projects} category={data.trackerType} />
        )}
        {data.trackerType === "ENGLISH" && <SpeakingSection logs={data.speakingLogs} />}
        {data.trackerType === "APTITUDE" && <AptitudeSection attempts={data.aptitudeAttempts} />}
        {data.trackerType === "COLLEGE" && <CollegeSection tasks={data.collegeTasks} />}

        {data.recentSessions.length > 0 && (
          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Recent sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border/60">
                {data.recentSessions.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{s.topicName}</p>
                      <p className="text-xs text-muted-foreground">
                        {trackerLabel(data.trackerType)} · {s.startedAt.toLocaleDateString([], { month: "short", day: "numeric" })}{" "}
                        {s.startedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-lg bg-accent/60 px-2 py-1 text-xs font-semibold tabular-nums">
                      {s.durationMin}m · +{s.xpEarned} XP
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
