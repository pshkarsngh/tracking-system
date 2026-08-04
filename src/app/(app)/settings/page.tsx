import type { Metadata } from "next";
import { requireUser } from "@/lib/server/auth";
import { getSettingsData } from "@/features/settings/server";
import { PageHeader } from "@/components/shared/page-header";
import { ProfileSection } from "@/components/features/settings/profile-section";
import { GoalsSection } from "@/components/features/settings/goals-section";
import { PreferencesSection } from "@/components/features/settings/preferences-section";
import { AccountSection } from "@/components/features/settings/account-section";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const data = await getSettingsData(user.id);

  return (
    <>
      <PageHeader title="Settings" description="Manage your profile, goals, and preferences." />

      <div className="flex flex-col gap-6">
        <ProfileSection user={data.user} />
        <GoalsSection user={data.user} />
        <PreferencesSection user={data.user} />
        <AccountSection user={data.user} />
      </div>
    </>
  );
}
