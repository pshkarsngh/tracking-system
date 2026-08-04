import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandProps {
  className?: string;
  compact?: boolean;
}

export function Brand({ className, compact }: BrandProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="bg-gradient-primary grid size-9 shrink-0 place-items-center rounded-xl shadow-lg shadow-indigo-500/30">
        <Sparkles className="size-5 text-white" />
      </div>
      {!compact && (
        <div className="leading-tight">
          <p className="font-heading text-lg font-bold tracking-tight">Momentum</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Productivity OS</p>
        </div>
      )}
    </div>
  );
}
