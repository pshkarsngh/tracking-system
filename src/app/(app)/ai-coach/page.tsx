import type { Metadata } from "next";
import { requireUser } from "@/lib/server/auth";
import { getCoachData } from "@/features/ai-coach/server";
import { PageHeader } from "@/components/shared/page-header";
import { CoachChat } from "@/components/features/ai-coach/coach-chat";

export const metadata: Metadata = { title: "AI Coach" };

export const dynamic = "force-dynamic";

export default async function AiCoachPage() {
  const user = await requireUser();
  const data = await getCoachData(user.id);

  return (
    <>
      <PageHeader
        title="AI Coach"
        description="Get personalized advice based on your activity"
        className="hidden lg:block"
      />
      <CoachChat history={data.history} recentActivity={data.recentActivity} />
    </>
  );
}
