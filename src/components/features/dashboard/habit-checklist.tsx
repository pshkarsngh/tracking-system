"use client";

import { useEffect, useActionState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleHabitAction } from "@/features/dashboard/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface HabitChecklistProps {
  habits: { id: string; name: string; icon: string | null; color: string | null; doneToday: boolean }[];
}

export function HabitChecklist({ habits }: HabitChecklistProps) {
  const [state, formAction, pending] = useActionState(toggleHabitAction, {});

  useEffect(() => {
    if (state?.levelUp) {
      toast.success(`Level up! You're now level ${state.levelUp.level}`);
    }
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  if (habits.length === 0) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Today&apos;s habits</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No habits yet. Add one from the <span className="font-medium text-foreground">Habits</span> page to start
            building streaks.
          </p>
        </CardContent>
      </Card>
    );
  }

  const doneCount = habits.filter((h) => h.doneToday).length;

  return (
    <Card className="glass">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold">Today&apos;s habits</CardTitle>
        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary tabular-nums">
          {doneCount}/{habits.length}
        </span>
      </CardHeader>
      <CardContent className="space-y-1">
        {habits.map((habit) => (
          <form
            key={habit.id}
            action={formAction}
            className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-accent/50"
          >
            <input type="hidden" name="habitId" value={habit.id} />
            <button
              type="submit"
              aria-pressed={habit.doneToday}
              disabled={pending}
              className="flex flex-1 items-center gap-3 text-left"
            >
              {habit.doneToday ? (
                <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />
              ) : (
                <Circle className="size-5 shrink-0 text-muted-foreground/60" />
              )}
              <span
                className={cn("text-sm", habit.doneToday && "text-muted-foreground line-through")}
              >
                {habit.name}
              </span>
            </button>
            {pending && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
          </form>
        ))}
      </CardContent>
    </Card>
  );
}
