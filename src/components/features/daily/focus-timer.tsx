"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import { Pause, Play, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { TRACKER_TYPES, TRACKER_META } from "@/config/trackers";
import { logSessionAction } from "@/features/daily/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FocusTimerProps {
  topicNames: { id: string; name: string; trackerType: string }[];
}

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function FocusTimer({ topicNames }: FocusTimerProps) {
  const [trackerType, setTrackerType] = useState<string>(TRACKER_TYPES[0]);
  const [topicName, setTopicName] = useState("");
  const [planned, setPlanned] = useState(25);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, pending] = useActionState(logSessionAction, {});

  useEffect(() => {
    if (state?.levelUp) toast.success(`Level up! You're now level ${state.levelUp.level}`);
    if (state?.error) toast.error(state.error);
    if (state?.ok) {
      setRunning(false);
      setElapsed(0);
    }
  }, [state]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const stopAndLog = useCallback(
    (usePlanned: boolean) => {
      const minutes = usePlanned ? planned : Math.max(1, Math.round(elapsed / 60));
      if (formRef.current) {
        const fd = new FormData(formRef.current);
        fd.set("durationMin", String(minutes));
        formAction(fd);
      }
    },
    [planned, elapsed, formAction]
  );

  const matchingTopics = topicNames.filter((t) => t.trackerType === trackerType);
  const timerDuration = running ? Math.max(0, planned * 60 - elapsed) : planned * 60;
  const progress = planned > 0 ? Math.min(100, (elapsed / (planned * 60)) * 100) : 0;

  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-heading text-base font-semibold">Focus timer</h3>
          <p className="text-xs text-muted-foreground">Deep work in focused minutes</p>
        </div>
        <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">
          {running ? "In progress" : "Ready"}
        </span>
      </div>

      <form ref={formRef} action={formAction} className="space-y-4">
        <input type="hidden" name="startedAt" value={new Date().toISOString()} />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="ft-tracker">Tracker</Label>
            <Select value={trackerType} onValueChange={setTrackerType}>
              <SelectTrigger id="ft-tracker">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRACKER_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TRACKER_META[t].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ft-topic">Topic</Label>
            <Input
              id="ft-topic"
              name="topicName"
              list="ft-topic-list"
              placeholder="e.g. Linked List"
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              required
            />
            <datalist id="ft-topic-list">
              {matchingTopics.map((t) => (
                <option key={t.id} value={t.name} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ft-minutes">Planned minutes</Label>
          <Input
            id="ft-minutes"
            type="number"
            min={1}
            max={720}
            value={planned}
            onChange={(e) => setPlanned(Math.max(1, Number(e.target.value) || 1))}
            disabled={running}
          />
        </div>

        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-5 text-center">
          <p className="font-heading text-4xl font-bold tabular-nums tracking-tight">
            {running ? formatClock(timerDuration) : formatClock(planned * 60)}
          </p>
          <div className="mx-auto mt-3 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-accent/60">
            <div
              className={cn("h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all", running && "animate-pulse")}
              style={{ width: `${running ? progress : 0}%` }}
            />
          </div>
        </div>

        <div className="flex gap-2">
          {!running ? (
            <Button type="button" className="flex-1" onClick={() => setRunning(true)} disabled={!topicName.trim()}>
              <Play className="size-4" /> Start
            </Button>
          ) : (
            <Button type="button" variant="outline" className="flex-1" onClick={() => setRunning(false)}>
              <Pause className="size-4" /> Pause
            </Button>
          )}
          <Button type="button" variant="secondary" className="flex-1" onClick={() => stopAndLog(false)} disabled={running && elapsed < 30} title={running && elapsed < 30 ? "Log at least 30s" : undefined}>
            <Square className="size-4" /> Stop &amp; log
          </Button>
        </div>
        {pending && <p className="text-center text-xs text-muted-foreground">Saving session…</p>}
      </form>
    </div>
  );
}
