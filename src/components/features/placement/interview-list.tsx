"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import { Mic, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MockInterviewDTO } from "@/features/placement/server";
import { INTERVIEW_TYPE_LABEL, INTERVIEW_TYPES } from "@/features/placement/server";
import { createMockInterviewAction, deleteMockInterviewAction } from "@/features/placement/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SubmitButton } from "@/components/shared/submit-button";
import { DeleteButton } from "@/components/shared/delete-button";

const TYPE_COLORS: Record<string, string> = {
  TECHNICAL: "bg-indigo-500/15 text-indigo-500",
  DSA: "bg-violet-500/15 text-violet-500",
  SYSTEM_DESIGN: "bg-sky-500/15 text-sky-500",
  HR: "bg-amber-500/15 text-amber-500",
  BEHAVIORAL: "bg-emerald-500/15 text-emerald-500",
  CODING: "bg-rose-500/15 text-rose-500",
};

function NewInterviewDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createMockInterviewAction, {});

  useEffect(() => {
    if (state?.levelUp) toast.success(`Level up! You're now level ${state.levelUp.level}`);
    if (state?.ok) setOpen(false);
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> Log interview
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log a mock interview</DialogTitle>
          <DialogDescription>Earn 150 XP per interview — reps build real confidence.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="mi-date">Date</Label>
              <Input id="mi-date" name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mi-type">Type</Label>
              <Select name="type" defaultValue="TECHNICAL">
                <SelectTrigger id="mi-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTERVIEW_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {INTERVIEW_TYPE_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="mi-min">Duration (min)</Label>
              <Input id="mi-min" name="durationMin" type="number" min={1} max={600} placeholder="45" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mi-rating">Self rating (1-10)</Label>
              <Input id="mi-rating" name="selfRating" type="number" min={1} max={10} placeholder="7" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mi-topic">Topic</Label>
            <Input id="mi-topic" name="topic" placeholder="Trees, behavioral STAR…" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mi-feedback">Feedback</Label>
            <Textarea id="mi-feedback" name="feedback" rows={3} placeholder="What went well, what to improve…" />
          </div>
          <SubmitButton className="w-full" disabled={pending}>
            Save interview
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function InterviewList({ interviews }: { interviews: MockInterviewDTO[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-heading text-base font-semibold">
            <Mic className="size-4 text-amber-400" /> Practice log
            <span className="rounded-full bg-accent/60 px-2 py-0.5 text-xs font-medium tabular-nums">{interviews.length} total</span>
          </h3>
          <p className="text-xs text-muted-foreground">Each interview earns 150 XP.</p>
        </div>
        <NewInterviewDialog />
      </div>

      {interviews.length === 0 ? (
        <p className="glass rounded-2xl border border-dashed py-10 text-center text-sm text-muted-foreground">
          No mock interviews yet. Log one after every practice round.
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {interviews.map((i) => (
            <div key={i.id} className="glass rounded-2xl p-4">
              <div className="mb-1.5 flex items-start justify-between gap-2">
                <div>
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", TYPE_COLORS[i.type] ?? "bg-accent/60")}>
                    {INTERVIEW_TYPE_LABEL[i.type] ?? i.type}
                  </span>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {i.date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
                    {i.durationMin ? ` · ${i.durationMin} min` : ""}
                    {i.topic ? ` · ${i.topic}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {i.selfRating && (
                    <span className="rounded-full bg-accent/60 px-2.5 py-1 text-xs font-semibold tabular-nums">{i.selfRating}/10</span>
                  )}
                  <form action={deleteMockInterviewAction}>
                    <input type="hidden" name="id" value={i.id} />
                    <DeleteButton confirmText="Delete this interview?" />
                  </form>
                </div>
              </div>
              {i.feedback && <p className="mt-2 rounded-xl bg-accent/40 px-3 py-2 text-xs text-muted-foreground">{i.feedback}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
