"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { createHabitAction } from "@/features/habits/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SubmitButton } from "@/components/shared/submit-button";

const COLORS = ["#6366f1", "#8b5cf6", "#10b981", "#f59e0b", "#0ea5e9", "#f43f5e", "#22c55e", "#a855f7"];

const FREQUENCIES = [
  { value: "DAILY", label: "Daily" },
  { value: "WEEKDAYS", label: "Weekdays" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "CUSTOM", label: "Custom" },
];

export function NewHabitDialog() {
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState(COLORS[0]);
  const [state, formAction, pending] = useActionState(createHabitAction, {});

  useEffect(() => {
    if (state?.ok) {
      toast.success("Habit created");
      setOpen(false);
    }
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> New habit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a habit</DialogTitle>
          <DialogDescription>Build a streak — small daily actions compound.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="color" value={color} />
          <div className="space-y-1.5">
            <Label htmlFor="habit-name">Name</Label>
            <Input id="habit-name" name="name" placeholder="e.g. LeetCode 1 problem" required maxLength={80} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="habit-freq">Frequency</Label>
              <Select name="frequency" defaultValue="DAILY">
                <SelectTrigger id="habit-freq">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="habit-target">Daily target</Label>
              <Input id="habit-target" name="targetCount" type="number" min={1} max={100} defaultValue={1} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="habit-unit">Unit (optional)</Label>
            <Input id="habit-unit" name="unit" placeholder="problems, minutes, pages…" />
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Color ${c}`}
                  onClick={() => setColor(c)}
                  className={cn(
                    "size-7 rounded-full transition-transform hover:scale-110",
                    color === c && "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="habit-desc">Notes (optional)</Label>
            <Textarea id="habit-desc" name="description" rows={2} placeholder="Why this habit matters…" />
          </div>
          <SubmitButton className="w-full" disabled={pending}>
            Create habit
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
