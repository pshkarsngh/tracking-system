import { cn } from "@/lib/utils";

interface ScoreBarProps {
  label: string;
  value: number; // 0..100
  hint?: string;
  color?: "emerald" | "amber" | "rose" | "sky" | "violet";
  className?: string;
}

const BAR_COLORS: Record<NonNullable<ScoreBarProps["color"]>, string> = {
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  sky: "bg-sky-500",
  violet: "bg-violet-500",
};

export function ScoreBar({ label, value, hint, color = "violet", className }: ScoreBarProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="flex items-baseline gap-1.5">
          {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
          <span className="font-heading text-sm font-semibold tabular-nums">{value}</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-accent/60" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className={cn("h-full rounded-full transition-all", BAR_COLORS[color])} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}
