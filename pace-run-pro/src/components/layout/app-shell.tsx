"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, Menu, Search } from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/layout/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import type { NavItem } from "./nav-config";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AppShellProps {
  nav: NavItem[];
  moreNav?: NavItem[];
  roleLabel: string;
  userName: string;
  userSubtitle: string;
  avatarUrl?: string;
  children: React.ReactNode;
  /** Extra content rendered above the user card in the sidebar */
  sidebarFooterSlot?: React.ReactNode;
  /** Extra actions rendered in the topbar (right side, before notifications) */
  headerActions?: React.ReactNode;
}

export function AppShell({
  nav,
  moreNav = [],
  roleLabel,
  userName,
  userSubtitle,
  avatarUrl,
  children,
  sidebarFooterSlot,
  headerActions,
}: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("sidebar-collapsed") === "true");
    } catch {
      // storage unavailable (private browsing or permissions)
    }
  }, []);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem("sidebar-collapsed", String(next));
    } catch {
      // storage unavailable (private browsing or permissions)
    }
  }

  function handleLogout() {
    signOut({ callbackUrl: "/login" });
  }

  function renderNavItem(item: NavItem, onClick?: () => void, forceExpanded = false) {
    const isCollapsed = collapsed && !forceExpanded;
    const active = pathname?.startsWith(item.href);
    const sectionLabel = item.sectionStart && !isCollapsed ? (
      <p key={`sec-${item.sectionStart}`} className="px-3.5 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted/50">
        {item.sectionStart}
      </p>
    ) : item.sectionStart && isCollapsed ? (
      <div key={`sec-${item.sectionStart}`} className="mx-auto my-2 h-px w-6 bg-border/60" />
    ) : null;

    return (
      <div key={item.href}>
        {sectionLabel}
        <Link
          href={item.href}
          onClick={onClick}
          title={item.label}
          className={cn(
            "group flex items-center rounded-xl py-2.5 text-sm font-medium text-text-muted transition-colors",
            isCollapsed ? "justify-center px-2.5" : "gap-3 px-3.5",
            active ? "bg-primary/15 text-primary" : "hover:bg-card-hover hover:text-text"
          )}
        >
          <item.icon
            className={cn(
              "h-[18px] w-[18px] shrink-0 transition-colors",
              active ? "text-primary" : "text-text-muted group-hover:text-text"
            )}
          />
          {!isCollapsed && (
            <>
              {item.label}
              {active && (
                <motion.span
                  layoutId="active-pill"
                  className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"
                />
              )}
            </>
          )}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh w-full">
      {/* Sidebar — desktop */}
      <aside
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-border bg-card/60 backdrop-blur-xl lg:flex print:hidden transition-all duration-200",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className={cn("flex items-center py-4 border-b border-border/40", collapsed ? "justify-center px-3" : "justify-between px-4")}>
          {!collapsed && <Logo size={32} />}
          <button
            onClick={toggleCollapsed}
            title={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-card-hover hover:text-text"
          >
            <Menu className="h-[18px] w-[18px]" />
          </button>
        </div>
        {!collapsed && (
          <p className="px-5 pt-3 pb-1 text-[10px] uppercase tracking-[0.16em] text-text-muted/70">{roleLabel}</p>
        )}

        <nav className="flex-1 overflow-y-auto space-y-0.5 px-3 pb-2 pt-1">
          {nav.map((item) => renderNavItem(item))}
          {moreNav.length > 0 && moreNav.map((item) => renderNavItem(item))}
        </nav>

        <div className="border-t border-border p-4">
          {!collapsed && sidebarFooterSlot && (
            <div className="mb-3">{sidebarFooterSlot}</div>
          )}
          <div className={cn("flex items-center gap-3 rounded-xl bg-card-hover/60 p-3", collapsed && "justify-center p-2")}>
            <Avatar className={collapsed ? "h-8 w-8" : "h-10 w-10"}>
              <AvatarImage src={avatarUrl} alt={userName} />
              <AvatarFallback>{userName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text">{userName}</p>
                <p className="truncate text-xs text-text-muted">{userSubtitle}</p>
              </div>
            )}
            <div className="ml-auto flex items-center gap-1">
              <ThemeToggle inline />
              <button
                onClick={handleLogout}
                aria-label="Sair"
                title="Sair"
                className="shrink-0 rounded-lg p-1.5 text-text-muted transition-colors hover:bg-card hover:text-danger"
              >
                <LogOut className="h-4 w-4" />
              </button>
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
              className="fixed inset-y-0 left-0 z-50 w-[min(288px,85vw)] border-r border-border bg-card p-4 lg:hidden"
            >
              <div className="mb-6 flex items-center justify-between px-2 pt-2">
                <Logo size={30} />
                <ThemeToggle inline />
              </div>
              <nav className="space-y-0.5">
                {nav.map((item) => renderNavItem(item, () => setMobileOpen(false), true))}
                {moreNav.length > 0 && moreNav.map((item) => renderNavItem(item, () => setMobileOpen(false), true))}
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogout();
                  }}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5 text-xs font-semibold text-danger transition-colors hover:border-danger/50 hover:bg-danger/5"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sair
                </button>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main column */}
      <div className="flex min-h-dvh flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-xl sm:px-6 print:hidden">
          <button
            className="rounded-lg p-2 text-text-muted hover:bg-card hover:text-text lg:hidden"
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
            {headerActions}
            <Badge variant="primary" className="hidden sm:inline-flex">
              <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-primary" />
              {roleLabel}
            </Badge>
            <NotificationBell />
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
