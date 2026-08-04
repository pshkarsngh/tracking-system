"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ListTodo, CheckSquare, Target, Sparkles, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS: { title: string; href: string; icon: LucideIcon }[] = [
  { title: "Home", href: "/dashboard", icon: LayoutDashboard },
  { title: "Daily", href: "/daily", icon: ListTodo },
  { title: "Habits", href: "/habits", icon: CheckSquare },
  { title: "Goals", href: "/goals", icon: Target },
  { title: "Coach", href: "/ai-coach", icon: Sparkles },
];

/** Mobile bottom navigation bar. */
export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Mobile"
      className="glass-strong fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="grid grid-cols-5">
        {ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("size-5", active && "bg-gradient-primary rounded-lg p-1 text-white")} />
              {item.title}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
