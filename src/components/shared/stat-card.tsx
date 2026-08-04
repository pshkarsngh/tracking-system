import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { delta: number; label?: string };
  iconClassName?: string;
  className?: string;
}

export function StatCard({ label, value, icon: Icon, trend, iconClassName, className }: StatCardProps) {
  const positive = (trend?.delta ?? 0) >= 0;
  return (
    <div
      className={cn(
        "glass rounded-2xl p-4 transition-colors hover:border-primary/30",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1.5 truncate font-heading text-2xl font-semibold tabular-nums">{value}</p>
          {trend && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <span className={cn("font-semibold", positive ? "text-emerald-500" : "text-rose-500")}>
                {positive ? "▲" : "▼"} {Math.abs(trend.delta)}%
              </span>
              {trend.label && <span>{trend.label}</span>}
            </p>
          )}
        </div>
        <div className={cn("grid size-10 shrink-0 place-items-center rounded-xl", iconClassName ?? "bg-primary/15 text-primary")}>
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}
