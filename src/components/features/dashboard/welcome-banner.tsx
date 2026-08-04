import { Flame, Zap } from "lucide-react";

interface WelcomeBannerProps {
  name: string;
  dateLabel: string;
  streak: number;
  xpToday: number;
  levelTitle: string;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Burning the midnight oil";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function WelcomeBanner({ name, dateLabel, streak, xpToday, levelTitle }: WelcomeBannerProps) {
  return (
    <div className="glass relative overflow-hidden rounded-3xl p-6 sm:p-8">
      <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-primary/15 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 size-72 rounded-full bg-fuchsia-500/10 blur-3xl" aria-hidden />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{dateLabel}</p>
          <h2 className="mt-1 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            {greeting()}, {name.split(" ")[0]}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            You&apos;re a <span className="font-medium text-gradient">{levelTitle}</span>. Make today count.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="glass-strong flex items-center gap-2.5 rounded-2xl px-4 py-3">
            <span className="grid size-9 place-items-center rounded-xl bg-orange-500/15 text-orange-500">
              <Flame className="size-5" />
            </span>
            <div>
              <p className="text-lg font-bold leading-none tabular-nums">{streak}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">day streak</p>
            </div>
          </div>
          <div className="glass-strong flex items-center gap-2.5 rounded-2xl px-4 py-3">
            <span className="grid size-9 place-items-center rounded-xl bg-indigo-500/15 text-indigo-400">
              <Zap className="size-5" />
            </span>
            <div>
              <p className="text-lg font-bold leading-none tabular-nums">+{xpToday}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">XP today</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
