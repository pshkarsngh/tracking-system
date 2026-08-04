import { ShieldCheck } from "lucide-react";
import { gradeFor } from "@/lib/domain/scores";
import type { ReadinessBreakdown } from "@/features/placement/server";
import { ProgressRing } from "@/components/shared/progress-ring";
import { ScoreBar } from "@/components/shared/score-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ROWS: { key: keyof ReadinessBreakdown; label: string; hint: string }[] = [
  { key: "dsa", label: "DSA", hint: "solved vs total" },
  { key: "aptitude", label: "Aptitude", hint: "avg accuracy" },
  { key: "communication", label: "Communication", hint: "fluency & confidence" },
  { key: "projects", label: "Projects", hint: "progress & completion" },
  { key: "resume", label: "Resume", hint: "featured work" },
  { key: "interview", label: "Interview", hint: "mock reps" },
];

export function ReadinessCard({ readiness }: { readiness: ReadinessBreakdown }) {
  const grade = gradeFor(readiness.score);
  return (
    <Card className="glass">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="size-4 text-emerald-400" /> Placement readiness
        </CardTitle>
        <span
          className={
            "rounded-full px-2.5 py-1 text-xs font-semibold " +
            (grade.color === "emerald"
              ? "bg-emerald-500/15 text-emerald-500"
              : grade.color === "sky"
                ? "bg-sky-500/15 text-sky-500"
                : grade.color === "amber"
                  ? "bg-amber-500/15 text-amber-500"
                  : "bg-rose-500/15 text-rose-500")
          }
        >
          {grade.label}
        </span>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <ProgressRing value={readiness.score} label={`${readiness.score}`} sublabel="/ 100" size={110} colors={["#10b981", "#22d3ee"]} />
        <div className="w-full space-y-3">
          {ROWS.map((row) => (
            <ScoreBar key={row.key} label={row.label} value={readiness[row.key]} hint={row.hint} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
