"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, Menu, Coins, Zap } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { navGroups, isActivePath } from "@/config/navigation";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { cn } from "@/lib/utils";

interface AppTopbarProps {
  user: { name: string | null; email: string | null; image: string | null };
  gamification: { xp: number; coins: number; level: number; currentStreak: number };
}

export function AppTopbar({ user, gamification }: AppTopbarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const activeTitle = (() => {
    for (const group of navGroups) {
      for (const item of group.items) {
        if (isActivePath(pathname, item.href)) return item.title;
      }
    }
    return "Dashboard";
  })();

  return (
    <>
      <header className="glass sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                className="grid size-9 place-items-center rounded-lg hover:bg-accent lg:hidden"
                aria-label="Open navigation"
              >
                <Menu className="size-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex h-16 items-center border-b px-5">
                <Brand />
              </div>
              <nav className="space-y-5 overflow-y-auto px-3 py-5">
                {navGroups.map((group) => (
                  <div key={group.title ?? group.items[0].href}>
                    {group.title && (
                      <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        {group.title}
                      </p>
                    )}
                    <ul className="space-y-0.5">
                      {group.items.map((item) => {
                        const active = isActivePath(pathname, item.href);
                        return (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              onClick={() => setOpen(false)}
                              className={cn(
                                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium",
                                active
                                  ? "bg-gradient-primary text-white shadow-lg shadow-indigo-500/25"
                                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
                              )}
                            >
                              <item.icon className="size-4.5" />
                              {item.title}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          <h1 className="font-heading text-lg font-semibold tracking-tight lg:hidden">{activeTitle}</h1>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Gamification chips */}
          <div className="mr-1 hidden items-center gap-1.5 sm:flex">
            <span
              className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-500"
              title="Current streak"
            >
              <Flame className="size-3.5" /> {gamification.currentStreak}
            </span>
            <span
              className="flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-400"
              title="Level & XP"
            >
              <Zap className="size-3.5" /> Lv {gamification.level} · {gamification.xp} XP
            </span>
            <span
              className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-500"
              title="Coins"
            >
              <Coins className="size-3.5" /> {gamification.coins}
            </span>
          </div>
          <ThemeToggle />
          <UserMenu user={user} />
        </div>
      </header>
    </>
  );
}
