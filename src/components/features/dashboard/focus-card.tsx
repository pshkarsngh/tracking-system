import { Clock, Timer } from "lucide-react";
import { ProgressRing } from "@/components/shared/progress-ring";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FocusCardProps {
  todayMinutes: number;
  dailyGoal: number;
  weekMinutes: number;
  weekGoal: number;
}

export function FocusCard({ todayMinutes, dailyGoal, weekMinutes, weekGoal }: FocusCardProps) {
  const todayPct = dailyGoal > 0 ? Math.round((todayMinutes / dailyGoal) * 100) : 0;
  const weekPct = weekGoal > 0 ? Math.round((weekMinutes / weekGoal) * 100) : 0;
  const goalMet = todayMinutes >= dailyGoal;

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Today&apos;s focus</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <ProgressRing
          value={Math.min(100, todayPct)}
          size={140}
          strokeWidth={12}
          label={`${todayPct}%`}
          sublabel={`${todayMinutes} / ${dailyGoal} min`}
          colors={goalMet ? ["#10b981", "#34d399"] : ["#6366f1", "#a855f7"]}
        />
        <div className="grid w-full grid-cols-2 gap-2 text-center">
          <div className="rounded-xl bg-muted/40 p-2.5">
            <p className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              <Clock className="size-3" /> Week
            </p>
            <p className="mt-0.5 font-heading text-lg font-semibold tabular-nums">
              {Math.round(weekMinutes / 60 * 10) / 10}h
            </p>
            <p className="text-[10px] text-muted-foreground">of {Math.round(weekGoal / 60)}h goal · {weekPct}%</p>
          </div>
          <div className="rounded-xl bg-muted/40 p-2.5">
            <p className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              <Timer className="size-3" /> Sessions
            </p>
            <p className="mt-0.5 font-heading text-lg font-semibold tabular-nums">{weekPct}%</p>
            <p className="text-[10px] text-muted-foreground">weekly target pace</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
