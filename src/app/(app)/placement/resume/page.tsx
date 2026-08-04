import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/server/auth";
import { getPlacementData } from "@/features/placement/server";
import { PageHeader } from "@/components/shared/page-header";
import { ReadinessCard } from "@/components/features/placement/readiness-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarHeart, CheckCircle2, FileText, GitBranch, Star } from "lucide-react";

export const metadata: Metadata = { title: "Resume Builder" };
export const dynamic = "force-dynamic";

export default async function ResumePage() {
  const user = await requireUser();
  const data = await getPlacementData(user.id);

  const projectStatus: Record<string, { label: string; cls: string }> = {
    NOT_STARTED: { label: "Not started", cls: "bg-muted text-muted-foreground" },
    IN_PROGRESS: { label: "In progress", cls: "bg-sky-500/15 text-sky-500" },
    DONE: { label: "Done", cls: "bg-emerald-500/15 text-emerald-500" },
    REVISION: { label: "Revision", cls: "bg-amber-500/15 text-amber-500" },
  };

  const daysLeft = data.daysToTarget;

  return (
    <div>
      <PageHeader
        title="Resume Builder"
        description="Your best work, front and center. Feature projects from the Projects tracker to build this resume."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          <Card className="glass">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="size-4 text-sky-400" /> Header
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h2 className="font-heading text-2xl font-bold">{data.user.name ?? "Your Name"}</h2>
                <p className="text-sm text-muted-foreground">{data.user.email}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="rounded-full bg-accent/60 px-3 py-1">{data.user.image ? "Portfolio: live" : "Portfolio: add a link"}</span>
              </div>
              <div className="rounded-xl border border-border/60 bg-accent/40 p-4 text-sm">
                <p className="font-medium">Recruiter checklist</p>
                <ul className="mt-2 space-y-1.5 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className={data.featuredProjects.length >= 2 ? "mt-0.5 size-4 text-emerald-500" : "mt-0.5 size-4 text-muted-foreground/50"} />
                    Feature 2-3 strong projects {data.featuredProjects.length >= 2 ? "✓ done" : `(${data.featuredProjects.length} featured)`}
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className={data.readiness.score >= 60 ? "mt-0.5 size-4 text-emerald-500" : "mt-0.5 size-4 text-muted-foreground/50"} />
                    Reach 60+ readiness {data.readiness.score >= 60 ? "✓ done" : `(${data.readiness.score})`}
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className={data.mockInterviews.length >= 3 ? "mt-0.5 size-4 text-emerald-500" : "mt-0.5 size-4 text-muted-foreground/50"} />
                    Complete 3+ mock interviews {data.mockInterviews.length >= 3 ? "✓ done" : `(${data.mockInterviews.length})`}
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Star className="size-4 text-amber-400" /> Featured projects
              </CardTitle>
              <Link href="/placement/portfolio">
                <Button variant="outline" size="sm">
                  Manage portfolio
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.featuredProjects.length === 0 && (
                <p className="rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground">
                  No featured projects yet. Feature your best work from the portfolio page.
                </p>
              )}
              {data.featuredProjects.map((p) => (
                <div key={p.id} className="rounded-xl border border-border/60 bg-background/40 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-medium">{p.name}</h3>
                    <Badge variant="secondary" className={projectStatus[p.status]?.cls ?? ""}>
                      {projectStatus[p.status]?.label ?? p.status}
                    </Badge>
                  </div>
                  {p.description && <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>}
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    {p.techStack.length > 0 && <span>{p.techStack.slice(0, 5).join(" · ")}</span>}
                    {p.repoUrl && (
                      <span className="flex items-center gap-1">
                        <GitBranch className="size-3.5" /> repo
                      </span>
                    )}
                    {p.liveUrl && <span className="flex items-center gap-1">🔗 live</span>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <ReadinessCard readiness={data.readiness} />
          {daysLeft !== null && (
            <Card className="glass">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <CalendarHeart className="size-4 text-rose-400" /> Target date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-heading text-2xl font-bold tabular-nums">
                  {data.user.placementTargetDate!.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{daysLeft >= 0 ? `${daysLeft} days to go` : "Past target — keep going"}</p>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
