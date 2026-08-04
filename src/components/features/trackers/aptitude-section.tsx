"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import { Calculator, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { createAptitudeAttemptAction, deleteAptitudeAttemptAction } from "@/features/trackers/actions";
import type { AptitudeAttemptDTO } from "@/features/trackers/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SubmitButton } from "@/components/shared/submit-button";
import { DeleteButton } from "@/components/shared/delete-button";
import { todayKey } from "@/lib/domain/dates";

function NewAttemptDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createAptitudeAttemptAction, {});

  useEffect(() => {
    if (state?.ok) {
      toast.success("Attempt saved");
      setOpen(false);
    }
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" /> Log attempt
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log an aptitude attempt</DialogTitle>
          <DialogDescription>Mock tests, timed sections, or practice sets.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ap-date">Date</Label>
              <Input id="ap-date" name="date" type="date" defaultValue={todayKey()} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ap-section">Section</Label>
              <Input id="ap-section" name="section" placeholder="Quantitative, Logical…" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ap-q">Questions</Label>
              <Input id="ap-q" name="questions" type="number" min={1} max={200} defaultValue={10} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ap-c">Correct</Label>
              <Input id="ap-c" name="correct" type="number" min={0} max={200} defaultValue={7} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ap-min">Minutes</Label>
              <Input id="ap-min" name="durationMin" type="number" min={1} max={600} placeholder="20" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ap-notes">Notes</Label>
            <Textarea id="ap-notes" name="notes" rows={2} placeholder="Weak areas, speed…" />
          </div>
          <SubmitButton className="w-full" disabled={pending}>
            Save attempt
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AptitudeSection({ attempts }: { attempts: AptitudeAttemptDTO[] }) {
  const avg = attempts.length
    ? Math.round((attempts.reduce((s, a) => s + (a.correct / Math.max(1, a.questions)) * 100, 0) / attempts.length) * 10) / 10
    : 0;

  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-heading text-base font-semibold">
            <Calculator className="size-4 text-amber-400" /> Aptitude attempts
            <span className="rounded-full bg-accent/60 px-2 py-0.5 text-xs font-medium tabular-nums">Avg {avg}%</span>
          </h3>
          <p className="text-xs text-muted-foreground">Quantitative, logical, and verbal reasoning practice.</p>
        </div>
        <NewAttemptDialog />
      </div>

      {attempts.length === 0 ? (
        <p className="rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground">
          No attempts logged yet — consistency here compounds for placement tests.
        </p>
      ) : (
        <ul className="space-y-2">
          {attempts.map((a) => {
            const pct = a.questions > 0 ? Math.round((a.correct / a.questions) * 100) : 0;
            return (
              <li key={a.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-background/40 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{a.section || "General"} · {a.date.toLocaleDateString([], { month: "short", day: "numeric" })}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.correct}/{a.questions} correct{a.durationMin ? ` · ${a.durationMin} min` : ""}
                    {a.notes ? ` · ${a.notes}` : ""}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums",
                    pct >= 70 ? "bg-emerald-500/15 text-emerald-500" : pct >= 50 ? "bg-amber-500/15 text-amber-500" : "bg-rose-500/15 text-rose-500"
                  )}
                >
                  {pct}%
                </span>
                <form action={deleteAptitudeAttemptAction}>
                  <input type="hidden" name="id" value={a.id} />
                  <DeleteButton confirmText="Delete this attempt?" />
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
