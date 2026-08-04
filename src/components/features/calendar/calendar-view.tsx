"use client";

import { useEffect, useMemo, useState } from "react";
import { useActionState } from "react";
import { format, parse, startOfWeek, getDay, addDays } from "date-fns";
import { enUS } from "date-fns/locale";
import { Calendar as RBCalendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarEventDTO } from "@/features/calendar/types";
import { saveEventAction, deleteEventAction, CATEGORY_META, CALENDAR_CATEGORIES } from "@/features/calendar/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SubmitButton } from "@/components/shared/submit-button";

const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales: { "en-US": enUS } });

const COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#f43f5e", "#a855f7", "#22c55e", "#8b5cf6"];

function toInputValue(d: Date): string {
  return format(d, "yyyy-MM-dd'T'HH:mm");
}

interface DialogState {
  open: boolean;
  event?: CalendarEventDTO;
  start: Date;
}

const messages = {
  today: "Today",
  previous: "Prev",
  next: "Next",
  month: "Month",
  week: "Week",
  day: "Day",
  agenda: "Agenda",
  date: "Date",
  time: "Time",
  event: "Event",
  noEventsInRange: "No events in this range.",
  showMore: (total: number) => `+${total} more`,
};

export function CalendarView({ events }: { events: CalendarEventDTO[] }) {
  const [dialog, setDialog] = useState<DialogState>({ open: false, start: new Date() });
  const [state, formAction, pending] = useActionState(saveEventAction, {});

  useEffect(() => {
    if (state?.ok) {
      toast.success(dialog.event ? "Event updated" : "Event created");
      setDialog((d) => ({ ...d, open: false }));
    }
    if (state?.error) toast.error(state.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const rbcEvents = useMemo(
    () =>
      events.map((e) => ({
        id: e.id,
        title: e.title,
        start: e.allDay ? new Date(e.startsAt) : new Date(e.startsAt),
        end: e.allDay ? addDays(new Date(e.endsAt), 1) : new Date(e.endsAt),
        allDay: e.allDay,
        resource: e,
      })),
    [events]
  );

  const eventStyleGetter = (rbcEvent: (typeof rbcEvents)[number]) => {
    const color = rbcEvent.resource?.color ?? "#6366f1";
    return {
      style: {
        backgroundColor: color,
        borderColor: color,
        borderRadius: 8,
        color: "#fff",
        fontSize: 12,
      },
    };
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {CALENDAR_CATEGORIES.map((c) => (
              <span key={c} className="inline-flex items-center gap-1.5 rounded-full bg-accent/60 px-2.5 py-1 text-xs font-medium">
                <span className="size-2 rounded-full" style={{ backgroundColor: CATEGORY_META[c].color }} />
                {CATEGORY_META[c].label}
              </span>
            ))}
          </div>
          <Button onClick={() => setDialog({ open: true, start: new Date() })}>
            <Plus className="size-4" /> New event
          </Button>
        </div>

        <div className="glass overflow-hidden rounded-2xl p-2 sm:p-4">
          <div className="rbc-calendar-theme h-[620px]">
            <RBCalendar
              localizer={localizer}
              events={rbcEvents}
              views={["month", "week", "day", "agenda"]}
              defaultView="month"
              messages={messages}
              popup
              selectable
              onSelectSlot={({ start }) => setDialog({ open: true, start })}
              onSelectEvent={(e) => setDialog({ open: true, event: e.resource, start: e.start as Date })}
              eventPropGetter={eventStyleGetter}
              className={cn("react-big-calendar")}
            />
          </div>
        </div>
      </div>

      <Dialog open={dialog.open} onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialog.event ? "Edit event" : "New event"}</DialogTitle>
            <DialogDescription>Block out study time, college work, interviews, or personal time.</DialogDescription>
          </DialogHeader>
          <form action={formAction} className="space-y-4">
            {dialog.event && <input type="hidden" name="id" value={dialog.event.id} />}
            <div className="space-y-1.5">
              <Label htmlFor="ev-title">Title</Label>
              <Input id="ev-title" name="title" placeholder="e.g. DSA — Arrays" required maxLength={120} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ev-start">Starts</Label>
                <Input id="ev-start" name="startsAt" type="datetime-local" required defaultValue={toInputValue(dialog.start)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ev-end">Ends</Label>
                <Input id="ev-end" name="endsAt" type="datetime-local" required defaultValue={toInputValue(dialog.event ? dialog.event.endsAt : addDays(dialog.start, 0))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ev-cat">Category</Label>
                <Select name="category" defaultValue={dialog.event?.category ?? "STUDY"}>
                  <SelectTrigger id="ev-cat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CALENDAR_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {CATEGORY_META[c].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex h-full items-end pb-1">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Checkbox name="allDay" defaultChecked={dialog.event?.allDay ?? false} />
                  All day
                </label>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <span key={c} className="relative">
                    <input type="radio" name="color" value={c} defaultChecked={c === (dialog.event?.color ?? "#6366f1")} className="peer sr-only" id={`ev-color-${c}`} />
                    <label
                      htmlFor={`ev-color-${c}`}
                      className="block size-7 cursor-pointer rounded-full transition-transform hover:scale-110 peer-checked:ring-2 peer-checked:ring-foreground peer-checked:ring-offset-2 peer-checked:ring-offset-background"
                      style={{ backgroundColor: c }}
                    />
                  </span>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-notes">Notes (optional)</Label>
              <Textarea id="ev-notes" name="notes" rows={2} placeholder="Details, links, prep…" />
            </div>
            <div className="flex justify-end">
              <SubmitButton className="min-w-28" disabled={pending}>
                Save event
              </SubmitButton>
            </div>
          </form>
          {dialog.event && (
            <form action={deleteEventAction} className="mt-1">
              <input type="hidden" name="id" value={dialog.event.id} />
              <SubmitButton variant="ghost" className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="size-4" /> Delete event
              </SubmitButton>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
