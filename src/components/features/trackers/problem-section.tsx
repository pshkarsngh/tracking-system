"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import { ExternalLink, Plus, Puzzle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProblemDTO } from "@/features/trackers/server";
import { PROBLEM_STATUS_LABEL } from "@/features/trackers/server";
import { createProblemAction, updateProblemStatusAction, deleteProblemAction } from "@/features/trackers/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SubmitButton } from "@/components/shared/submit-button";
import { DeleteButton } from "@/components/shared/delete-button";

const DIFFICULTY_META: Record<string, { label: string; cls: string }> = {
  EASY: { label: "Easy", cls: "bg-emerald-500/10 text-emerald-500" },
  MEDIUM: { label: "Medium", cls: "bg-amber-500/10 text-amber-500" },
  HARD: { label: "Hard", cls: "bg-rose-500/10 text-rose-500" },
};

const STATUS_CYCLE: Record<string, string> = {
  NOT_STARTED: "ATTEMPTED",
  ATTEMPTED: "SOLVED",
  SOLVED: "REVISION",
  REVISION: "NOT_STARTED",
};

function NewProblemDialog({ topics }: { topics: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createProblemAction, {});

  useEffect(() => {
    if (state?.ok) {
      toast.success("Problem added");
      setOpen(false);
    }
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" /> Add problem
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a problem</DialogTitle>
          <DialogDescription>Log it before solving — solving it earns XP.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pb-title">Title</Label>
            <Input id="pb-title" name="title" placeholder="Two Sum" required maxLength={200} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pb-diff">Difficulty</Label>
              <Select name="difficulty" defaultValue="MEDIUM">
                <SelectTrigger id="pb-diff">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EASY">Easy</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HARD">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pb-platform">Platform</Label>
              <Input id="pb-platform" name="platform" placeholder="LeetCode, GfG…" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pb-topic">Topic</Label>
              <Select name="topicId" defaultValue="">
                <SelectTrigger id="pb-topic">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {topics.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pb-url">URL</Label>
              <Input id="pb-url" name="url" type="url" placeholder="https://…" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pb-tags">Tags (comma-separated)</Label>
            <Input id="pb-tags" name="tags" placeholder="arrays, two-pointer" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pb-notes">Notes (optional)</Label>
            <Textarea id="pb-notes" name="notes" rows={2} />
          </div>
          <SubmitButton className="w-full" disabled={pending}>
            Add problem
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ProblemSection({ problems, topics }: { problems: ProblemDTO[]; topics: { id: string; name: string }[] }) {
  const [state, formAction] = useActionState(updateProblemStatusAction, {});

  useEffect(() => {
    if (state?.levelUp) toast.success(`Level up! You're now level ${state.levelUp.level}`);
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-heading text-base font-semibold">
            <Puzzle className="size-4 text-violet-400" /> Problems
            <span className="rounded-full bg-accent/60 px-2 py-0.5 text-xs font-medium tabular-nums">{problems.length}</span>
          </h3>
          <p className="text-xs text-muted-foreground">Solved problems earn 30–100 XP by difficulty.</p>
        </div>
        <NewProblemDialog topics={topics} />
      </div>

      {problems.length === 0 ? (
        <p className="rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground">
          No problems yet — add one, then work the status from Not started → Attempted → Solved.
        </p>
      ) : (
        <ul className="space-y-2">
          {problems.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-background/40 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {p.title}
                  {p.url && (
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="ml-1.5 inline-flex text-muted-foreground hover:text-foreground" aria-label="Open problem">
                      <ExternalLink className="size-3.5" />
                    </a>
                  )}
                </p>
                <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <span className={cn("rounded-full px-2 py-px font-semibold", DIFFICULTY_META[p.difficulty]?.cls ?? "bg-accent/60")}>
                    {DIFFICULTY_META[p.difficulty]?.label ?? p.difficulty}
                  </span>
                  {p.platform && <span>{p.platform}</span>}
                  {p.topicName && <span>· {p.topicName}</span>}
                  {p.tags.length > 0 && <span>· {p.tags.slice(0, 4).join(", ")}{p.tags.length > 4 ? "…" : ""}</span>}
                </p>
              </div>
              <form action={formAction}>
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="status" value={STATUS_CYCLE[p.status] ?? "ATTEMPTED"} />
                <button
                  type="submit"
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                    p.status === "SOLVED"
                      ? "bg-emerald-500/15 text-emerald-500"
                      : p.status === "ATTEMPTED"
                        ? "bg-amber-500/15 text-amber-500"
                        : p.status === "REVISION"
                          ? "bg-sky-500/15 text-sky-500"
                          : "bg-accent/60 text-muted-foreground hover:text-foreground"
                  )}
                  title={`Next: ${PROBLEM_STATUS_LABEL[STATUS_CYCLE[p.status] ?? "ATTEMPTED"]}`}
                >
                  {PROBLEM_STATUS_LABEL[p.status]}
                </button>
              </form>
              <form action={deleteProblemAction}>
                <input type="hidden" name="id" value={p.id} />
                <DeleteButton confirmText="Delete this problem?" />
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
