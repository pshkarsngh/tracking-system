import type { Metadata } from "next";
import { requireUser } from "@/lib/server/auth";
import { getTrackerData } from "@/features/trackers/server";
import { TrackerPage } from "@/components/features/trackers/tracker-page";

export const metadata: Metadata = { title: "English Tracker" };
export const dynamic = "force-dynamic";

export default async function EnglishTrackerPage() {
  const user = await requireUser();
  const data = await getTrackerData(user.id, "ENGLISH");
  return <TrackerPage data={data} />;
}
