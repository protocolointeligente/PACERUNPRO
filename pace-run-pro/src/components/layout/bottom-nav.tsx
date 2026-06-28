"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "./nav-config";

export function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 lg:hidden print:hidden"
      style={{
        background: "rgba(10,12,15,0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div
        className="mx-auto flex max-w-[480px] items-stretch justify-between px-2"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}
      >
        {items.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-[5px] pt-3 pb-1 transition-colors",
                "min-h-[56px]",
              )}
            >
              {/* active indicator line */}
              {active && (
                <div
                  className="absolute top-0 h-[2px] rounded-full"
                  style={{
                    width: 28, left: "50%", transform: "translateX(-50%)",
                    background: "#C6F24E",
                  }}
                />
              )}

              {/* icon */}
              <item.icon
                className="h-[22px] w-[22px] transition-colors"
                style={{ color: active ? "#C6F24E" : "#5C636B", strokeWidth: active ? 2 : 1.7 }}
              />

              {/* label */}
              <span
                className="text-[10px] font-medium tracking-wide transition-colors"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: "0.06em",
                  color: active ? "#ECEAE3" : "#5C636B",
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
