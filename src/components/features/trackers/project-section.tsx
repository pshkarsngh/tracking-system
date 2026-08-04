"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import { ExternalLink, FolderGit2, GitBranch, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrackerTypeValue } from "@/config/trackers";
import type { ProjectDTO } from "@/features/trackers/types";
import { createProjectAction, updateProjectAction, deleteProjectAction } from "@/features/trackers/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SubmitButton } from "@/components/shared/submit-button";
import { DeleteButton } from "@/components/shared/delete-button";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  NOT_STARTED: { label: "Not started", cls: "bg-muted text-muted-foreground" },
  IN_PROGRESS: { label: "In progress", cls: "bg-sky-500/15 text-sky-500" },
  DONE: { label: "Done", cls: "bg-emerald-500/15 text-emerald-500" },
  REVISION: { label: "Revision", cls: "bg-amber-500/15 text-amber-500" },
};

const PROJECT_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "DONE", "REVISION"];

export function ProjectDialog({ project, category }: { project?: ProjectDTO | null; category: TrackerTypeValue }) {
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(project?.progress ?? 0);
  const action = project ? updateProjectAction : createProjectAction;
  const [state, formAction, pending] = useActionState(action, {});

  useEffect(() => {
    if (state?.ok) {
      toast.success(project ? "Project updated" : "Project created");
      setOpen(false);
    }
    if (state?.error) toast.error(state.error);
  }, [state, project]);

  const isEdit = Boolean(project);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="sm" className="h-7 text-muted-foreground hover:text-foreground">
            Edit
          </Button>
        ) : (
          <Button size="sm">
            <Plus className="size-4" /> New project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit project" : "New project"}</DialogTitle>
          <DialogDescription>Track scope, progress, and showcase it on your portfolio.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {isEdit && <input type="hidden" name="id" value={project!.id} />}
          <input type="hidden" name="category" value={category} />
          <div className="space-y-1.5">
            <Label htmlFor={`pr-name-${category}`}>Name</Label>
            <Input id={`pr-name-${category}`} name="name" defaultValue={project?.name ?? ""} placeholder="e.g. Momentum — Personal OS" required maxLength={200} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor={`pr-repo-${category}`}>Repo URL</Label>
              <Input id={`pr-repo-${category}`} name="repoUrl" defaultValue={project?.repoUrl ?? ""} type="url" placeholder="github.com/you/repo" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`pr-live-${category}`}>Live URL</Label>
              <Input id={`pr-live-${category}`} name="liveUrl" defaultValue={project?.liveUrl ?? ""} type="url" placeholder="yoursite.dev" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor={`pr-status-${category}`}>Status</Label>
              <Select name="status" defaultValue={project?.status ?? "IN_PROGRESS"}>
                <SelectTrigger id={`pr-status-${category}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_META[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Progress: {progress}%</Label>
              <input type="hidden" name="progress" value={progress} />
              <Slider
                defaultValue={[project?.progress ?? 0]}
                max={100}
                step={5}
                onValueChange={(v) => setProgress(v[0])}
                aria-label="Project progress"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`pr-stack-${category}`}>Tech stack (comma-separated)</Label>
            <Input id={`pr-stack-${category}`} name="techStack" defaultValue={project?.techStack.join(", ")} placeholder="Next.js, Tailwind, Prisma" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`pr-desc-${category}`}>Description</Label>
            <Textarea id={`pr-desc-${category}`} name="description" defaultValue={project?.description ?? ""} rows={3} placeholder="What it does, what you built…" />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <Checkbox name="featured" defaultChecked={project?.featured ?? false} />
            Feature on resume &amp; portfolio
          </label>
          <SubmitButton className="w-full" disabled={pending}>
            {isEdit ? "Save changes" : "Create project"}
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ProjectSection({ projects, category }: { projects: ProjectDTO[]; category: TrackerTypeValue }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-heading text-base font-semibold">
            <FolderGit2 className="size-4 text-rose-400" /> Projects
            <span className="rounded-full bg-accent/60 px-2 py-0.5 text-xs font-medium tabular-nums">{projects.length}</span>
          </h3>
          <p className="text-xs text-muted-foreground">Featured projects power your portfolio &amp; resume.</p>
        </div>
        <ProjectDialog category={category} />
      </div>

      {projects.length === 0 ? (
        <p className="rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground">
          No projects yet — build something and track it here.
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {projects.map((p) => (
            <div key={p.id} className="rounded-xl border border-border/60 bg-background/40 p-3.5">
              <div className="mb-1.5 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {p.name}
                    {p.featured && <span className="ml-1.5 rounded-full bg-primary/15 px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-primary">Featured</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">{p.techStack.slice(0, 5).join(" · ") || "No stack listed"}</p>
                </div>
                <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold", STATUS_META[p.status]?.cls ?? "bg-muted")}>
                  {STATUS_META[p.status]?.label ?? p.status}
                </span>
              </div>
              {p.description && <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>}
              <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-accent/60">
                <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${p.progress}%` }} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="tabular-nums">{p.progress}%</span>
                  {p.repoUrl && (
                    <a href={p.repoUrl} target="_blank" rel="noopener noreferrer" className="hover:text-foreground" aria-label="Repository">
                      <GitBranch className="size-3.5" />
                    </a>
                  )}
                  {p.liveUrl && (
                    <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" className="hover:text-foreground" aria-label="Live site">
                      <ExternalLink className="size-3.5" />
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <ProjectDialog project={p} category={category} />
                  <form action={deleteProjectAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <DeleteButton confirmText="Delete this project?" />
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
