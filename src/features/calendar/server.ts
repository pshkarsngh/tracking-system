import { prisma } from "@/lib/db";
import { todayKey, fromDateKey, addDaysToKey } from "@/lib/domain/dates";

export interface CalendarEventDTO {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  allDay: boolean;
  category: string | null;
  color: string | null;
  notes: string | null;
}

export interface CalendarData {
  events: CalendarEventDTO[];
  upcoming: { id: string; title: string; startsAt: Date; category: string | null; color: string | null }[];
  todayKey: string;
  eventsThisWeek: number;
}

/**
 * Load calendar events in a wide window (3 months back, 5 months ahead)
 * so month navigation within the app stays snappy without extra fetches.
 */
export async function getCalendarData(userId: string): Promise<CalendarData> {
  const today = todayKey();
  const windowStart = addDaysToKey(today, -90);
  const windowEnd = addDaysToKey(today, 150);

  const [events, upcoming] = await Promise.all([
    prisma.calendarEvent.findMany({
      where: { userId, startsAt: { gte: fromDateKey(windowStart), lte: fromDateKey(windowEnd) } },
      orderBy: { startsAt: "asc" },
      select: {
        id: true,
        title: true,
        startsAt: true,
        endsAt: true,
        allDay: true,
        category: true,
        color: true,
        notes: true,
      },
    }),
    prisma.calendarEvent.findMany({
      where: { userId, endsAt: { gte: new Date() } },
      orderBy: { startsAt: "asc" },
      take: 6,
      select: { id: true, title: true, startsAt: true, category: true, color: true },
    }),
  ]);

  const now = new Date().getTime();
  const weekMs = 7 * 86_400_000;
  const eventsThisWeek = events.filter((e) => {
    const end = e.endsAt.getTime();
    return end >= now && end - now <= weekMs;
  }).length;

  return { events, upcoming, todayKey: today, eventsThisWeek };
}
