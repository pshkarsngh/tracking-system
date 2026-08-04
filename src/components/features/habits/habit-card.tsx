"use client";

import { useEffect, useActionState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Circle, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HabitWithData } from "@/features/habits/server";
import { toggleHabitForDateAction, deleteHabitAction } from "@/features/habits/actions";
import { DeleteButton } from "@/components/shared/delete-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function DayCell({ done, day }: { done: boolean; day: string }) {
  const [, m, d] = day.split("-");
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] uppercase text-muted-foreground">{new Date(day + "T00:00:00").getDay() === 0 ? "S" : ["M", "T", "W", "T", "F", "S"][new Date(day + "T00:00:00").getDay() - 1]}</span>
      <div
        className={cn("grid size-6 place-items-center rounded-md text-[10px] font-semibold", done ? "text-white" : "bg-accent/50 text-muted-foreground")}
        style={done ? { backgroundColor: undefined, backgroundImage: "linear-gradient(135deg,#6366f1,#a855f7)" } : undefined}
      >
        {d}
      </div>
      {done && <CheckCircle2 className="size-3 text-emerald-500" />}
    </div>
  );
}

export function HabitCard({ habit }: { habit: HabitWithData }) {
  const [state, formAction, pending] = useActionState(toggleHabitForDateAction, {});

  useEffect(() => {
    if (state?.levelUp) toast.success(`Level up! You're now level ${state.levelUp.level}`);
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <Card className="glass">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-1">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: habit.color ?? "#6366f1" }} />
          {habit.name}
        </CardTitle>
        <div className="flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-xs font-semibold text-orange-500">
          <Flame className="size-3.5" />
          {habit.currentStreak}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            {habit.frequency === "WEEKDAYS" ? "Weekdays" : habit.frequency === "WEEKLY" ? "Weekly" : habit.frequency === "CUSTOM" ? "Custom" : "Daily"}
            {habit.unit ? ` · ${habit.targetCount} ${habit.unit}` : ""}
          </span>
          <form action={formAction}>
            <input type="hidden" name="habitId" value={habit.id} />
            <button
              type="submit"
              aria-pressed={habit.doneToday}
              disabled={pending}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                habit.doneToday
                  ? "bg-emerald-500/15 text-emerald-500"
                  : "bg-accent/60 text-muted-foreground hover:text-foreground"
              )}
            >
              {habit.doneToday ? <CheckCircle2 className="size-3.5" /> : <Circle className="size-3.5" />}
              {habit.doneToday ? "Done" : "Mark done"}
            </button>
          </form>
        </div>

        <div className="flex justify-between gap-1.5 overflow-x-auto pb-1">
          {habit.week.map((day) => (
            <DayCell key={day.key} day={day.key} done={day.done} />
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2 text-xs text-muted-foreground">
          <span>Best streak: {habit.bestStreak}</span>
          <span>Total: {habit.totalCompletions}</span>
          <form action={deleteHabitAction}>
            <input type="hidden" name="id" value={habit.id} />
            <DeleteButton confirmText="Delete this habit and its history?" />
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
