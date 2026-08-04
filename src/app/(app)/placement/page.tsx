import type { Metadata } from "next";
import { requireUser } from "@/lib/server/auth";
import { getPlacementData } from "@/features/placement/server";
import { PageHeader } from "@/components/shared/page-header";
import { ApplicationPipeline, ApplicationDialog } from "@/components/features/placement/application-pipeline";
import { ReadinessCard } from "@/components/features/placement/readiness-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarClock } from "lucide-react";
import type { ApplicationDTO } from "@/features/placement/types";

export const metadata: Metadata = { title: "Placement" };
export const dynamic = "force-dynamic";

export default async function PlacementPage() {
  const user = await requireUser();
  const data = await getPlacementData(user.id);

  const upcoming = data.applications
    .filter((a: ApplicationDTO) => a.nextRoundAt && a.status !== "OFFER" && a.status !== "REJECTED" && a.status !== "WITHDRAWN")
    .sort((a: ApplicationDTO, b: ApplicationDTO) => (a.nextRoundAt!.getTime() - b.nextRoundAt!.getTime()))
    .slice(0, 5);

  return (
    <div>
      <PageHeader title="Placement" description={`${data.applications.length} applications tracked · ${data.user.name ?? "Your"} journey to the offer`}>
        <ApplicationDialog />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          {upcoming.length > 0 && (
            <Card className="glass border-amber-500/25">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <CalendarClock className="size-4 text-amber-400" /> Upcoming rounds
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {upcoming.map((a: ApplicationDTO) => (
                    <div key={a.id} className="rounded-xl border border-border/60 bg-background/40 px-3 py-2">
                      <p className="text-xs font-semibold">{a.company}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {a.nextRoundAt!.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}{" "}
                        at {a.nextRoundAt!.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          <ApplicationPipeline applications={data.applications} counts={data.counts} />
        </div>

        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <ReadinessCard readiness={data.readiness} />
        </aside>
      </div>
    </div>
  );
}
