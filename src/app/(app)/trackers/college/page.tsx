import type { Metadata } from "next";
import { requireUser } from "@/lib/server/auth";
import { getTrackerData } from "@/features/trackers/server";
import { TrackerPage } from "@/components/features/trackers/tracker-page";

export const metadata: Metadata = { title: "College Tracker" };
export const dynamic = "force-dynamic";

export default async function CollegeTrackerPage() {
  const user = await requireUser();
  const data = await getTrackerData(user.id, "COLLEGE");
  return <TrackerPage data={data} />;
}
