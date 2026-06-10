"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu, Search } from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { NavItem } from "./nav-config";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AppShellProps {
  nav: NavItem[];
  moreNav?: NavItem[];
  roleLabel: string;
  userName: string;
  userSubtitle: string;
  avatarUrl?: string;
  children: React.ReactNode;
  switchHref?: string;
  switchLabel?: string;
}

export function AppShell({
  nav,
  moreNav = [],
  roleLabel,
  userName,
  userSubtitle,
  avatarUrl,
  children,
  switchHref,
  switchLabel,
}: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function renderNavLink(item: NavItem, onClick?: () => void) {
    const active = pathname?.startsWith(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClick}
        className={cn(
          "group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-text-muted transition-colors",
          active
            ? "bg-primary/15 text-white"
            : "hover:bg-card-hover hover:text-white"
        )}
      >
        <item.icon
          className={cn(
            "h-[18px] w-[18px] transition-colors",
            active ? "text-primary" : "text-text-muted group-hover:text-white"
          )}
        />
        {item.label}
        {active && (
          <motion.span
            layoutId="active-pill"
            className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"
          />
        )}
      </Link>
    );
  }

  return (
    <div className="flex min-h-dvh w-full">
      {/* Sidebar — desktop */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border bg-card/60 backdrop-blur-xl lg:flex">
        <div className="px-5 py-5">
          <Logo size={32} />
          <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-text-muted/70 pl-0.5">{roleLabel}</p>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {nav.map((item) => renderNavLink(item))}
          {moreNav.length > 0 && (
            <>
              <p className="px-3.5 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted/50">
                Mais
              </p>
              {moreNav.map((item) => renderNavLink(item))}
            </>
          )}
        </nav>

        <div className="border-t border-border p-4">
          {switchHref && (
            <Link
              href={switchHref}
              className="mb-3 flex items-center justify-center rounded-xl border border-border px-3 py-2 text-xs font-semibold text-text-muted transition-colors hover:border-primary/50 hover:text-white"
            >
              {switchLabel}
            </Link>
          )}
          <div className="flex items-center gap-3 rounded-xl bg-card-hover/60 p-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={avatarUrl} alt={userName} />
              <AvatarFallback>{userName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{userName}</p>
              <p className="truncate text-xs text-text-muted">{userSubtitle}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed inset-y-0 left-0 z-50 w-72 border-r border-border bg-[#070b18] p-4 lg:hidden"
            >
              <div className="mb-6 px-2 pt-2">
                <Logo size={30} />
              </div>
              <nav className="space-y-1">
                {nav.map((item) => renderNavLink(item, () => setMobileOpen(false)))}
                {moreNav.length > 0 && (
                  <>
                    <p className="px-3.5 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted/50">
                      Mais
                    </p>
                    {moreNav.map((item) => renderNavLink(item, () => setMobileOpen(false)))}
                  </>
                )}
                {switchHref && (
                  <Link
                    href={switchHref}
                    onClick={() => setMobileOpen(false)}
                    className="mt-4 flex items-center justify-center rounded-xl border border-border px-3 py-2.5 text-xs font-semibold text-text-muted"
                  >
                    {switchLabel}
                  </Link>
                )}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main column */}
      <div className="flex min-h-dvh flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-xl sm:px-6">
          <button
            className="rounded-lg p-2 text-text-muted hover:bg-card hover:text-white lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm text-text-muted sm:flex sm:w-72">
            <Search className="h-4 w-4" />
            <span className="text-xs">Buscar atletas, treinos, exercícios…</span>
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <Badge variant="primary" className="hidden sm:inline-flex">
              <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-primary" />
              {roleLabel}
            </Badge>
            <button className="relative rounded-lg p-2 text-text-muted hover:bg-card hover:text-white" aria-label="Notificações">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger" />
            </button>
            <Avatar className="h-9 w-9 lg:hidden">
              <AvatarImage src={avatarUrl} alt={userName} />
              <AvatarFallback>{userName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="flex-1 px-4 pb-24 pt-5 sm:px-6 lg:pb-10">{children}</main>
      </div>
    </div>
  );
}
