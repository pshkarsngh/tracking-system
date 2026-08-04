import type { Metadata } from "next";
import { requireUser } from "@/lib/server/auth";
import { getTrackerData } from "@/features/trackers/server";
import { TrackerPage } from "@/components/features/trackers/tracker-page";

export const metadata: Metadata = { title: "Aptitude Tracker" };
export const dynamic = "force-dynamic";

export default async function AptitudeTrackerPage() {
  const user = await requireUser();
  const data = await getTrackerData(user.id, "APTITUDE");
  return <TrackerPage data={data} />;
}
