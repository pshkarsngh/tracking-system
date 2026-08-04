import { Briefcase, CalendarClock, GraduationCap, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UpcomingProps {
  collegeTasks: { id: string; title: string; type: string; dueDate: Date | null; status: string }[];
  interviews: { id: string; title: string; date: Date }[];
  goalDeadlines: { id: string; title: string; targetDate: Date | null; progress: number }[];
}

const dueLabel = (d: Date | null) => {
  if (!d) return "No due date";
  const diff = Math.ceil((d.getTime() - Date.now()) / 86_400_000);
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return "Due today";
  if (diff === 1) return "Tomorrow";
  return `In ${diff} days`;
};

export function UpcomingCard({ collegeTasks, interviews, goalDeadlines }: UpcomingProps) {
  const items: { id: string; icon: typeof Target; iconClass: string; label: string; sub: string }[] = [
    ...collegeTasks.map((t) => ({
      id: `ct-${t.id}`,
      icon: GraduationCap,
      iconClass: "text-sky-400 bg-sky-500/10",
      label: t.title,
      sub: `${t.type} · ${dueLabel(t.dueDate)}`,
    })),
    ...interviews.map((i) => ({
      id: `mi-${i.id}`,
      icon: Briefcase,
      iconClass: "text-rose-400 bg-rose-500/10",
      label: `${i.title} interview`,
      sub: dueLabel(i.date),
    })),
    ...goalDeadlines.map((g) => ({
      id: `g-${g.id}`,
      icon: Target,
      iconClass: "text-amber-400 bg-amber-500/10",
      label: g.title,
      sub: `${Math.round(g.progress)}% done · ${dueLabel(g.targetDate)}`,
    })),
  ].sort((a, b) => (a.sub.includes("overdue") ? -1 : 0) - (b.sub.includes("overdue") ? -1 : 0));

  return (
    <Card className="glass">
      <CardHeader className="flex-row items-center gap-2 space-y-0 pb-2">
        <CalendarClock className="size-4 text-muted-foreground" />
        <CardTitle className="text-sm font-semibold">Upcoming</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing due. Enjoy the calm.</p>
        ) : (
          <ul className="space-y-1">
            {items.slice(0, 6).map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-accent/50">
                  <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${item.iconClass}`}>
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.sub}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
