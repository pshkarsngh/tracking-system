import type { Metadata } from "next";
import { requireUser } from "@/lib/server/auth";
import { getPortfolioData } from "@/features/placement/server";
import { PageHeader } from "@/components/shared/page-header";
import { PortfolioGrid } from "@/components/features/placement/portfolio-grid";
import { StatCard } from "@/components/shared/stat-card";
import { FolderOpen, Star, TrendingUp } from "lucide-react";

export const metadata: Metadata = { title: "Portfolio" };
export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const user = await requireUser();
  const data = await getPortfolioData(user.id);

  const avgProgress = data.projects.length
    ? Math.round(data.projects.reduce((s, p) => s + p.progress, 0) / data.projects.length)
    : 0;

  return (
    <div>
      <PageHeader
        title="Portfolio"
        description="Every project from your trackers, ready to share. Feature the best ones."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="Projects" value={data.projects.length} icon={FolderOpen} iconClassName="bg-indigo-500/15 text-indigo-400" />
        <StatCard label="Featured" value={data.featuredCount} icon={Star} iconClassName="bg-amber-500/15 text-amber-400" />
        <StatCard label="Avg progress" value={`${avgProgress}%`} icon={TrendingUp} iconClassName="bg-emerald-500/15 text-emerald-400" />
      </div>

      <PortfolioGrid projects={data.projects} />
    </div>
  );
}
