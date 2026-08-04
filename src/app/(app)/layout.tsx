import { requireUserWithStats } from "@/lib/server/auth";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { MobileNav } from "@/components/mobile-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUserWithStats();

  return (
    <>
      <div className="ambient-glow" aria-hidden />
      <AppSidebar />
      <div className="flex min-h-dvh flex-col lg:pl-64">
        <AppTopbar
          user={{ name: user.name, email: user.email, image: user.image }}
          gamification={{
            xp: user.xp,
            coins: user.coins,
            level: user.level,
            currentStreak: user.currentStreak,
          }}
        />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 pb-24 sm:px-6 lg:py-8 lg:pb-10">
          {children}
        </main>
      </div>
      <MobileNav />
    </>
  );
}
