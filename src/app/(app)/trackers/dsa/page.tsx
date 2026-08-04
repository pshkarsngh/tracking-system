import type { Metadata } from "next";
import { requireUser } from "@/lib/server/auth";
import { getTrackerData } from "@/features/trackers/server";
import { TrackerPage } from "@/components/features/trackers/tracker-page";

export const metadata: Metadata = { title: "DSA Tracker" };
export const dynamic = "force-dynamic";

export default async function DsaTrackerPage() {
  const user = await requireUser();
  const data = await getTrackerData(user.id, "DSA");
  return <TrackerPage data={data} />;
}
