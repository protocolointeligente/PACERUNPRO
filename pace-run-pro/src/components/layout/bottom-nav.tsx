"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "./nav-config";
import { motion } from "framer-motion";

export function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/90 shadow-[0_-12px_40px_rgba(0,0,0,0.12)] backdrop-blur-xl lg:hidden print:hidden">
      <div className="mx-auto flex max-w-2xl items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium text-text-muted transition-colors"
            >
              {active && (
                <motion.span
                  layoutId="bottom-nav-active"
                  className="absolute top-0 h-0.5 w-8 rounded-full bg-primary"
                />
              )}
              <span className={cn("flex h-8 w-8 items-center justify-center rounded-2xl transition-colors", active ? "bg-primary/10 text-primary" : "text-text-muted")}>
                <item.icon className="h-[18px] w-[18px] transition-colors" />
              </span>
              <span className={cn("max-w-[58px] truncate", active ? "text-text" : "")}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
