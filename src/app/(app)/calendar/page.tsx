import type { Metadata } from "next";
import { CalendarClock, CalendarDays, ListChecks, Zap } from "lucide-react";
import { requireUser } from "@/lib/server/auth";
import { getCalendarData } from "@/features/calendar/server";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { CalendarView } from "@/components/features/calendar/calendar-view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Calendar" };
export const dynamic = "force-dynamic";

function formatWhen(d: Date): string {
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 86_400_000);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(d, today)) return `Today · ${d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  if (sameDay(d, tomorrow)) return `Tomorrow · ${d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

export default async function CalendarPage() {
  const user = await requireUser();
  const data = await getCalendarData(user.id);

  return (
    <>
      <PageHeader title="Calendar" description="Your time, blocked and visible." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Events in view" value={data.events.length} icon={CalendarDays} iconClassName="bg-indigo-500/15 text-indigo-400" />
        <StatCard label="Next 7 days" value={data.eventsThisWeek} icon={CalendarClock} iconClassName="bg-emerald-500/15 text-emerald-400" />
        <StatCard label="Upcoming" value={data.upcoming.length} icon={ListChecks} iconClassName="bg-amber-500/15 text-amber-400" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <CalendarView events={data.events} />
        <div className="space-y-6">
          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Zap className="size-4 text-amber-400" /> Coming up
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.upcoming.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Nothing scheduled yet.</p>
              ) : (
                <ul className="space-y-3">
                  {data.upcoming.map((e) => (
                    <li key={e.id} className="flex items-start gap-2.5">
                      <span className="mt-1.5 size-2 shrink-0 rounded-full" style={{ backgroundColor: e.color ?? "#6366f1" }} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{e.title}</p>
                        <p className="text-xs text-muted-foreground">{formatWhen(e.startsAt)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
