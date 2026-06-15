"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "./nav-config";
import { motion } from "framer-motion";

export function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-[#070b18]/90 backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex max-w-2xl items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-text-muted transition-colors"
            >
              {active && (
                <motion.span
                  layoutId="bottom-nav-active"
                  className="absolute top-0 h-0.5 w-8 rounded-full gradient-primary"
                />
              )}
              <item.icon className={cn("h-5 w-5 transition-colors", active ? "text-primary" : "text-text-muted")} />
              <span className={cn(active ? "text-text" : "")}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
