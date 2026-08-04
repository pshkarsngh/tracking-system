"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navGroups, isActivePath } from "@/config/navigation";
import { Brand } from "@/components/brand";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="glass-strong fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r lg:flex">
      <div className="flex h-16 items-center border-b px-5">
        <Brand />
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="Main">
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
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-gradient-primary text-white shadow-lg shadow-indigo-500/25"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <item.icon className={cn("size-4.5 shrink-0", active ? "text-white" : "text-muted-foreground group-hover:text-foreground")} />
                      <span className="truncate">{item.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t p-4">
        <p className="text-[10px] text-muted-foreground">
          Momentum v0.1 · Built for your placement year
        </p>
      </div>
    </aside>
  );
}
