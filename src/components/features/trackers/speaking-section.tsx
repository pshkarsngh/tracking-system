"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import { MessageSquare, Plus } from "lucide-react";
import { createSpeakingLogAction, deleteSpeakingLogAction } from "@/features/trackers/actions";
import type { SpeakingLogDTO } from "@/features/trackers/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SubmitButton } from "@/components/shared/submit-button";
import { DeleteButton } from "@/components/shared/delete-button";
import { todayKey } from "@/lib/domain/dates";

function NewSpeakingDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createSpeakingLogAction, {});

  useEffect(() => {
    if (state?.levelUp) toast.success(`Level up! You're now level ${state.levelUp.level}`);
    if (state?.ok) setOpen(false);
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" /> Log practice
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log speaking practice</DialogTitle>
          <DialogDescription>Every minute of English practice earns 2 XP.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sp-date">Date</Label>
              <Input id="sp-date" name="date" type="date" defaultValue={todayKey()} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sp-min">Minutes</Label>
              <Input id="sp-min" name="durationMin" type="number" min={1} max={600} defaultValue={30} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sp-fluency">Fluency (1-10)</Label>
              <Input id="sp-fluency" name="fluency" type="number" min={1} max={10} placeholder="7" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sp-conf">Confidence (1-10)</Label>
              <Input id="sp-conf" name="confidence" type="number" min={1} max={10} placeholder="7" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sp-topic">Topic</Label>
            <Input id="sp-topic" name="topic" placeholder="Self-intro, interview answers…" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sp-notes">Notes</Label>
            <Textarea id="sp-notes" name="notes" rows={2} />
          </div>
          <SubmitButton className="w-full" disabled={pending}>
            Save practice
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function fmtDate(d: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);
}

export function SpeakingSection({ logs }: { logs: SpeakingLogDTO[] }) {
  const totalMin = logs.reduce((s, l) => s + l.durationMin, 0);
  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-heading text-base font-semibold">
            <MessageSquare className="size-4 text-emerald-400" /> Speaking practice
            <span className="rounded-full bg-accent/60 px-2 py-0.5 text-xs font-medium tabular-nums">{totalMin} min</span>
          </h3>
          <p className="text-xs text-muted-foreground">Track fluency, confidence, and speaking volume.</p>
        </div>
        <NewSpeakingDialog />
      </div>

      {logs.length === 0 ? (
        <p className="rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground">
          No practice logged yet — your voice is part of the score.
        </p>
      ) : (
        <ul className="space-y-2">
          {logs.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-background/40 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {l.topic || "General practice"} · {fmtDate(l.date)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {l.durationMin} min
                  {l.fluency ? ` · Fluency ${l.fluency}/10` : ""}
                  {l.confidence ? ` · Confidence ${l.confidence}/10` : ""}
                  {l.notes ? ` · ${l.notes}` : ""}
                </p>
              </div>
              <form action={deleteSpeakingLogAction}>
                <input type="hidden" name="id" value={l.id} />
                <DeleteButton confirmText="Delete this log?" />
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
