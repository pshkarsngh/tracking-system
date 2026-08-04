"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import { BookOpen, Plus, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrackerTypeValue } from "@/config/trackers";
import type { TopicDTO } from "@/features/trackers/server";
import { TOPIC_STATUSES_LABEL } from "@/features/trackers/server";
import {
  createTopicAction,
  updateTopicStatusAction,
  deleteTopicAction,
  logTopicSessionAction,
} from "@/features/trackers/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SubmitButton } from "@/components/shared/submit-button";
import { DeleteButton } from "@/components/shared/delete-button";

function NewTopicDialog({ trackerType }: { trackerType: TrackerTypeValue }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createTopicAction, {});

  useEffect(() => {
    if (state?.ok) {
      toast.success("Topic created");
      setOpen(false);
    }
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="size-4" /> New topic
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a topic</DialogTitle>
          <DialogDescription>Break the tracker into concrete, revisitable topics.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="trackerType" value={trackerType} />
          <div className="space-y-1.5">
            <Label htmlFor={`topic-name-${trackerType}`}>Name</Label>
            <Input id={`topic-name-${trackerType}`} name="name" placeholder="e.g. Dynamic Programming" required maxLength={120} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`topic-notes-${trackerType}`}>Notes (optional)</Label>
            <Textarea id={`topic-notes-${trackerType}`} name="notes" rows={2} placeholder="Key takeaways, links…" />
          </div>
          <SubmitButton className="w-full" disabled={pending}>
            Create topic
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LogSessionDialog({ topic }: { topic: TopicDTO }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(logTopicSessionAction, {});

  useEffect(() => {
    if (state?.levelUp) toast.success(`Level up! You're now level ${state.levelUp.level}`);
    if (state?.ok) setOpen(false);
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-muted-foreground hover:text-foreground">
          <Timer className="size-3.5" /> Log
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Log session · {topic.name}</DialogTitle>
          <DialogDescription>Minutes studied earn 1 XP per minute.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="topicId" value={topic.id} />
          <div className="space-y-1.5">
            <Label htmlFor={`ls-min-${topic.id}`}>Minutes</Label>
            <Input id={`ls-min-${topic.id}`} name="durationMin" type="number" min={1} max={720} defaultValue={60} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`ls-notes-${topic.id}`}>Notes (optional)</Label>
            <Textarea id={`ls-notes-${topic.id}`} name="notes" rows={2} />
          </div>
          <SubmitButton className="w-full" disabled={pending}>
            Save session
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TopicSection({ topics, trackerType }: { topics: TopicDTO[]; trackerType: TrackerTypeValue }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-heading text-base font-semibold">
            <BookOpen className="size-4 text-indigo-400" /> Topics
          </h3>
          <p className="text-xs text-muted-foreground">Plan what to master, then log focus sessions against it.</p>
        </div>
        <NewTopicDialog trackerType={trackerType} />
      </div>

      {topics.length === 0 ? (
        <p className="rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground">
          No topics yet — create one to start tracking.
        </p>
      ) : (
        <ul className="space-y-2">
          {topics.map((topic) => (
            <li key={topic.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-background/40 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{topic.name}</p>
                <p className="text-xs text-muted-foreground">
                  {topic.totalSessions} sessions · {topic.totalMinutes} min
                  {topic.notes ? ` · ${topic.notes}` : ""}
                </p>
              </div>
              <LogSessionDialog topic={topic} />
              <form action={updateTopicStatusAction}>
                <input type="hidden" name="id" value={topic.id} />
                <button
                  type="submit"
                  name="status"
                  value={topic.status === "DONE" ? "REVISION" : topic.status === "IN_PROGRESS" ? "DONE" : "IN_PROGRESS"}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                    topic.status === "IN_PROGRESS"
                      ? "bg-indigo-500/15 text-indigo-400"
                      : topic.status === "DONE"
                        ? "bg-emerald-500/15 text-emerald-500"
                        : "bg-accent/60 text-muted-foreground hover:text-foreground"
                  )}
                  title={TOPIC_STATUSES_LABEL[topic.status]}
                >
                  {TOPIC_STATUSES_LABEL[topic.status]}
                </button>
              </form>
              <form action={deleteTopicAction}>
                <input type="hidden" name="id" value={topic.id} />
                <DeleteButton confirmText="Delete this topic? Its sessions stay." />
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
