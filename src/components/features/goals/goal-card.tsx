"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import { Archive, Check, CheckCircle2, Flag, Plus, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GoalDTO } from "@/features/goals/server";
import { GOAL_CATEGORY_LABEL, PRIORITY_META } from "@/features/goals/server";
import {
  createGoalAction,
  updateGoalAction,
  toggleMilestoneAction,
  completeGoalAction,
  archiveGoalAction,
  deleteGoalAction,
} from "@/features/goals/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SubmitButton } from "@/components/shared/submit-button";
import { DeleteButton } from "@/components/shared/delete-button";

const CATEGORIES = ["DSA", "WEB_DEV", "AI_ML", "ENGLISH", "APTITUDE", "COLLEGE", "PROJECT"];
const PRIORITIES = ["URGENT", "HIGH", "MEDIUM", "LOW"];

function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function GoalDialog({ goal }: { goal?: GoalDTO | null }) {
  const [open, setOpen] = useState(false);
  const action = goal ? updateGoalAction : createGoalAction;
  const [state, formAction, pending] = useActionState(action, {});
  const isEdit = Boolean(goal);

  useEffect(() => {
    if (state?.ok) {
      toast.success(goal ? "Goal updated" : "Goal created");
      setOpen(false);
    }
    if (state?.levelUp) toast.success(`Level up! You're now level ${state.levelUp.level}`);
    if (state?.error) toast.error(state.error);
  }, [state, goal]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="sm" className="h-7 text-muted-foreground hover:text-foreground">
            Edit
          </Button>
        ) : (
          <Button>
            <Plus className="size-4" /> New goal
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit goal" : "Set a goal"}</DialogTitle>
          <DialogDescription>Break it into milestones — each one you complete earns 150 XP.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {isEdit && <input type="hidden" name="id" value={goal!.id} />}
          <div className="space-y-1.5">
            <Label htmlFor="g-title">Title</Label>
            <Input id="g-title" name="title" defaultValue={goal?.title ?? ""} placeholder="Complete 100 DSA problems" required maxLength={140} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="g-desc">Description</Label>
            <Textarea id="g-desc" name="description" rows={2} defaultValue={goal?.description ?? ""} placeholder="Why this matters…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="g-cat">Category</Label>
              <Select name="category" defaultValue={goal?.category ?? "DSA"}>
                <SelectTrigger id="g-cat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {GOAL_CATEGORY_LABEL[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="g-prio">Priority</Label>
              <Select name="priority" defaultValue={goal?.priority ?? "MEDIUM"}>
                <SelectTrigger id="g-prio">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_META[p].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="g-date">Target date</Label>
            <Input id="g-date" name="targetDate" type="date" defaultValue={goal?.targetDate ? toDateInput(goal.targetDate) : ""} />
          </div>
          {!isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="g-milestones">Milestones (one per line)</Label>
              <Textarea id="g-milestones" name="milestones" rows={3} placeholder={"Install environment\nSolve 10 arrays\nFinalize project stack"} />
            </div>
          )}
          <SubmitButton className="w-full" disabled={pending}>
            {isEdit ? "Save changes" : "Create goal"}
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function GoalCard({ goal }: { goal: GoalDTO }) {
  const [state, formAction] = useActionState(toggleMilestoneAction, {});

  useEffect(() => {
    if (state?.levelUp) toast.success(`Level up! You're now level ${state.levelUp.level}`);
    if (state?.error) toast.error(state.error);
  }, [state]);

  const doneCount = goal.milestones.filter((m) => m.done).length;
  const meta = PRIORITY_META[goal.priority] ?? PRIORITY_META.MEDIUM;
  const due = goal.dueInDays;

  return (
    <div className={cn("glass flex flex-col rounded-2xl p-5", goal.overdue && "border-rose-500/40")}>
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {goal.category && (
            <span className="rounded-full bg-indigo-500/15 px-2.5 py-0.5 text-xs font-semibold text-indigo-400">
              {GOAL_CATEGORY_LABEL[goal.category] ?? goal.category}
            </span>
          )}
          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", meta.cls)}>{meta.label}</span>
          {due !== null && (
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                goal.overdue ? "bg-rose-500/15 text-rose-500" : "bg-accent/60 text-muted-foreground"
              )}
            >
              {goal.overdue ? "Overdue" : due === 0 ? "Due today" : due > 0 ? `${due}d left` : `${-due}d ago`}
            </span>
          )}
        </div>
        <GoalDialog goal={goal} />
      </div>

      <h3 className="font-heading text-base font-semibold">{goal.title}</h3>
      {goal.description && <p className="mt-1 text-sm text-muted-foreground">{goal.description}</p>}

      <div className="mt-3 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-accent/60">
          <div
            className={cn("h-full rounded-full transition-all", goal.progress >= 100 ? "bg-emerald-500" : "bg-gradient-to-r from-indigo-500 to-violet-500")}
            style={{ width: `${goal.progress}%` }}
          />
        </div>
        <span className="text-xs font-semibold tabular-nums text-muted-foreground">{goal.progress}%</span>
      </div>

      <ul className="mt-3 flex-1 space-y-1.5">
        {goal.milestones.length === 0 && <li className="text-xs text-muted-foreground">No milestones yet.</li>}
        {goal.milestones.map((m) => (
          <li key={m.id}>
            <form action={formAction}>
              <input type="hidden" name="id" value={goal.id} />
              <input type="hidden" name="milestoneId" value={m.id} />
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent/50"
              >
                <span
                  className={cn(
                    "grid size-4.5 shrink-0 place-items-center rounded-md border transition-colors",
                    m.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-border"
                  )}
                >
                  {m.done && <Check className="size-3" />}
                </span>
                <span className={cn(m.done && "text-muted-foreground line-through")}>{m.title}</span>
              </button>
            </form>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Flag className="size-3.5" />
          {doneCount}/{goal.milestones.length} · +150 XP each
        </span>
        <div className="flex items-center gap-1">
          {goal.progress < 100 && (
            <form action={completeGoalAction}>
              <input type="hidden" name="id" value={goal.id} />
              <SubmitButton variant="outline" size="sm" className="h-7 gap-1 px-2 text-[11px]">
                <Trophy className="size-3.5" /> Complete
              </SubmitButton>
            </form>
          )}
          <form action={archiveGoalAction}>
            <input type="hidden" name="id" value={goal.id} />
            <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground hover:text-foreground" aria-label="Archive">
              <Archive className="size-4" />
            </Button>
          </form>
          <form action={deleteGoalAction}>
            <input type="hidden" name="id" value={goal.id} />
            <DeleteButton confirmText="Delete this goal?" />
          </form>
        </div>
      </div>
    </div>
  );
}

export function DoneGoalCard({ goal }: { goal: GoalDTO }) {
  return (
    <div className="glass flex items-start gap-3 rounded-2xl p-4 opacity-80">
      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{goal.title}</p>
        <p className="text-xs text-muted-foreground">
          {goal.status === "COMPLETED" ? "Completed" : "Archived"}
          {goal.xpEarned > 0 && ` · +${goal.xpEarned} XP`}
        </p>
      </div>
      <form action={deleteGoalAction}>
        <input type="hidden" name="id" value={goal.id} />
        <DeleteButton confirmText="Remove this goal?" />
      </form>
    </div>
  );
}
