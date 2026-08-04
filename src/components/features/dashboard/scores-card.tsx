import { Gauge } from "lucide-react";
import { ProgressRing } from "@/components/shared/progress-ring";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Score {
  label: string;
  value: number;
  color: [string, string];
  hint: string;
}

const COLORS: Record<string, [string, string]> = {
  emerald: ["#10b981", "#34d399"],
  indigo: ["#6366f1", "#a855f7"],
  sky: ["#0ea5e9", "#38bdf8"],
};

export function ScoresCard({ scores }: { scores: { label: string; value: number; hint: string }[] }) {
  const items: Score[] = scores.map((s, i) => ({
    ...s,
    color: Object.values(COLORS)[i % Object.keys(COLORS).length],
  }));

  return (
    <Card className="glass">
      <CardHeader className="flex-row items-center gap-2 space-y-0 pb-2">
        <Gauge className="size-4 text-muted-foreground" />
        <CardTitle className="text-sm font-semibold">Your scores</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap justify-around gap-4">
        {items.map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-1.5">
            <ProgressRing value={s.value} size={88} strokeWidth={8} label={`${s.value}`} sublabel="%" colors={s.color} />
            <div className="text-center">
              <p className="text-xs font-medium">{s.label}</p>
              <p className="text-[10px] text-muted-foreground">{s.hint}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
