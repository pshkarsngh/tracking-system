"use client";

import { FolderOpen, ExternalLink, GitBranch, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleProjectFeaturedAction } from "@/features/placement/actions";
import { EmptyState } from "@/components/shared/empty-state";

export interface PortfolioProject {
  id: string;
  name: string;
  description: string | null;
  repoUrl: string | null;
  liveUrl: string | null;
  status: string;
  techStack: string[];
  featured: boolean;
  progress: number;
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  NOT_STARTED: { label: "Not started", cls: "bg-muted text-muted-foreground" },
  IN_PROGRESS: { label: "In progress", cls: "bg-sky-500/15 text-sky-500" },
  DONE: { label: "Done", cls: "bg-emerald-500/15 text-emerald-500" },
  REVISION: { label: "Revision", cls: "bg-amber-500/15 text-amber-500" },
};

export function PortfolioGrid({ projects }: { projects: PortfolioProject[] }) {
  if (projects.length === 0) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="Nothing to show yet"
        description="Projects you create under Web Dev, AI/ML, or the Projects tracker will appear here. Feature the best ones for recruiters."
      />
    );
  }

  const sorted = [...projects].sort((a, b) => Number(b.featured) - Number(a.featured));

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {sorted.map((p) => (
        <div key={p.id} className="glass group relative flex flex-col rounded-2xl p-5 transition-colors hover:border-primary/30">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
              <FolderOpen className="size-5" />
            </div>
            <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", STATUS_META[p.status]?.cls ?? "bg-muted")}>
              {STATUS_META[p.status]?.label ?? p.status}
            </span>
          </div>
          <h3 className="font-heading text-base font-semibold">{p.name}</h3>
          {p.description && <p className="mt-1 line-clamp-3 flex-1 text-sm text-muted-foreground">{p.description}</p>}
          {p.techStack.length > 0 && <p className="mt-2 text-xs text-muted-foreground">{p.techStack.slice(0, 6).join(" · ")}</p>}

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-accent/60">
            <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${p.progress}%` }} />
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
            <form action={toggleProjectFeaturedAction}>
              <input type="hidden" name="id" value={p.id} />
              <button
                type="submit"
                aria-pressed={p.featured}
                title={p.featured ? "Remove from featured" : "Feature on resume & portfolio"}
                className={cn(
                  "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
                  p.featured ? "bg-amber-500/15 text-amber-500" : "bg-accent/60 text-muted-foreground hover:text-foreground"
                )}
              >
                <Star className={cn("size-3.5", p.featured && "fill-amber-500")} />
                {p.featured ? "Featured" : "Feature"}
              </button>
            </form>
          </div>
        </div>
      ))}
    </div>
  );
}
