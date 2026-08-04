"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { SubmitButton } from "@/components/shared/submit-button";
import { updateGoalsAction } from "@/features/settings/actions";
import type { SettingsData } from "@/features/settings/types";

export function GoalsSection({ user }: { user: SettingsData["user"] }) {
  const [state, formAction] = useActionState(updateGoalsAction, {});
  const [daily, setDaily] = useState(user.dailyGoalMinutes);

  useEffect(() => {
    if (state.ok) toast.success("Goals updated");
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <div className="glass rounded-2xl p-5">
      <h2 className="mb-4 font-heading text-lg font-semibold">Study Goals</h2>
      <form action={formAction} className="flex flex-col gap-4">
        <div className="grid gap-2">
          <Label htmlFor="dailyGoalMinutes">
            Daily Goal: {daily} min ({Math.round(daily / 60)}h {daily % 60}m)
          </Label>
          <input type="hidden" name="dailyGoalMinutes" value={daily} />
          <Slider
            min={30}
            max={480}
            step={15}
            value={[daily]}
            onValueChange={([v]) => setDaily(v)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="weeklyGoalMinutes">Weekly Goal (minutes)</Label>
          <Input
            id="weeklyGoalMinutes"
            name="weeklyGoalMinutes"
            type="number"
            min={210}
            max={3360}
            step={30}
            defaultValue={user.weeklyGoalMinutes}
          />
        </div>

        <SubmitButton className="w-fit">Save Goals</SubmitButton>
      </form>
    </div>
  );
}
