import type { Metadata } from "next";
import { requireUser } from "@/lib/server/auth";
import { getTrackerData } from "@/features/trackers/server";
import { TrackerPage } from "@/components/features/trackers/tracker-page";

export const metadata: Metadata = { title: "AI / ML Tracker" };
export const dynamic = "force-dynamic";

export default async function AimlTrackerPage() {
  const user = await requireUser();
  const data = await getTrackerData(user.id, "AI_ML");
  return <TrackerPage data={data} />;
}
