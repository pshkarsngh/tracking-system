"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import { GraduationCap, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { createCollegeTaskAction, updateCollegeTaskStatusAction, deleteCollegeTaskAction } from "@/features/trackers/actions";
import type { CollegeTaskDTO } from "@/features/trackers/server";
import { TASK_TYPE_LABEL, TASK_STATUS_LABEL, PRIORITY_LABEL } from "@/features/trackers/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SubmitButton } from "@/components/shared/submit-button";
import { DeleteButton } from "@/components/shared/delete-button";

const STATUS_CYCLE: Record<string, string> = {
  PENDING: "IN_PROGRESS",
  IN_PROGRESS: "COMPLETED",
  COMPLETED: "PENDING",
  OVERDUE: "IN_PROGRESS",
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-muted text-muted-foreground",
  MEDIUM: "bg-sky-500/15 text-sky-500",
  HIGH: "bg-amber-500/15 text-amber-500",
  URGENT: "bg-rose-500/15 text-rose-500",
};

function NewTaskDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createCollegeTaskAction, {});

  useEffect(() => {
    if (state?.ok) {
      toast.success("Task added");
      setOpen(false);
    }
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" /> New task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a college task</DialogTitle>
          <DialogDescription>Assignments, attendance, classes, exams, and labs.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ct-title">Title</Label>
            <Input id="ct-title" name="title" placeholder="DBMS assignment 3" required maxLength={200} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ct-subject">Subject</Label>
              <Input id="ct-subject" name="subject" placeholder="Database Systems" required maxLength={120} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ct-due">Due date</Label>
              <Input id="ct-due" name="dueDate" type="date" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ct-type">Type</Label>
              <Select name="type" defaultValue="ASSIGNMENT">
                <SelectTrigger id="ct-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TASK_TYPE_LABEL).map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ct-priority">Priority</Label>
              <Select name="priority" defaultValue="MEDIUM">
                <SelectTrigger id="ct-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ct-notes">Notes (optional)</Label>
            <Textarea id="ct-notes" name="notes" rows={2} />
          </div>
          <SubmitButton className="w-full" disabled={pending}>
            Add task
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function isOverdue(task: CollegeTaskDTO): boolean {
  return task.dueDate !== null && task.status !== "COMPLETED" && task.dueDate.getTime() < Date.now();
}

export function CollegeSection({ tasks }: { tasks: CollegeTaskDTO[] }) {
  const visible = tasks.map((t) => ({ ...t, status: isOverdue(t) ? "OVERDUE" : t.status }));
  const open = visible.filter((t) => t.status !== "COMPLETED");

  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-heading text-base font-semibold">
            <GraduationCap className="size-4 text-sky-400" /> College tasks
            <span className="rounded-full bg-accent/60 px-2 py-0.5 text-xs font-medium tabular-nums">{open.length} open</span>
          </h3>
          <p className="text-xs text-muted-foreground">Keep academics from silently eating your week.</p>
        </div>
        <NewTaskDialog />
      </div>

      {tasks.length === 0 ? (
        <p className="rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground">
          No college tasks yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {visible.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-background/40 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-sm font-medium", t.status === "COMPLETED" && "text-muted-foreground line-through")}>
                  {t.title}
                </p>
                <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground/80">{t.subject}</span>
                  <span>· {TASK_TYPE_LABEL[t.type] ?? t.type}</span>
                  {t.dueDate && <span>· due {t.dueDate.toLocaleDateString([], { month: "short", day: "numeric" })}</span>}
                  {t.notes ? ` · ${t.notes}` : ""}
                </p>
              </div>
              <span className={cn("shrink-0 rounded-full px-2 py-px text-[11px] font-semibold", PRIORITY_COLORS[t.priority] ?? "bg-muted")}>
                {PRIORITY_LABEL[t.priority]}
              </span>
              <form action={updateCollegeTaskStatusAction}>
                <input type="hidden" name="id" value={t.id} />
                <input type="hidden" name="status" value={STATUS_CYCLE[t.status] ?? "IN_PROGRESS"} />
                <button
                  type="submit"
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                    t.status === "COMPLETED"
                      ? "bg-emerald-500/15 text-emerald-500"
                      : t.status === "OVERDUE"
                        ? "bg-rose-500/15 text-rose-500"
                        : t.status === "IN_PROGRESS"
                          ? "bg-sky-500/15 text-sky-500"
                          : "bg-accent/60 text-muted-foreground hover:text-foreground"
                  )}
                  title={STATUS_CYCLE[t.status]}
                >
                  {TASK_STATUS_LABEL[t.status]}
                </button>
              </form>
              <form action={deleteCollegeTaskAction}>
                <input type="hidden" name="id" value={t.id} />
                <DeleteButton confirmText="Delete this task?" />
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
