"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BOTTOM_NAV_ITEMS } from "./nav";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav md:hidden">
      {BOTTOM_NAV_ITEMS.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={`bottom-nav-item ${active ? "active" : ""}`}>
            <span className="ico">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
