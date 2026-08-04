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
