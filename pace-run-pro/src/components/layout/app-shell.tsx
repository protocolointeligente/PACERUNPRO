"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ChevronRight, LogOut, Menu, Search, X } from "lucide-react";
import { createContext, useContext } from "react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/layout/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import type { NavItem, NavGroup } from "./nav-config";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Context so children (BottomNav) can trigger the mobile drawer
export const AppShellDrawerContext = createContext<{ openDrawer: () => void }>({ openDrawer: () => {} });
export function useAppShellDrawer() { return useContext(AppShellDrawerContext); }

interface AppShellProps {
  nav: NavItem[];
  moreNav?: NavItem[];
  navGroups?: NavGroup[];
  /** Items rendered before groups (or nav) — always visible, never inside a collapsible group */
  topNav?: NavItem[];
  /** Where the header logo links to — typically the role dashboard */
  logoHref?: string;
  roleLabel: string;
  userName: string;
  userSubtitle: string;
  avatarUrl?: string;
  children: React.ReactNode;
  /** Extra content rendered above the user card in the sidebar */
  sidebarFooterSlot?: React.ReactNode;
  /** Extra actions rendered in the topbar (right side, before notifications) */
  headerActions?: React.ReactNode;
  notificationRole?: string;
}

export function AppShell({
  nav,
  moreNav = [],
  navGroups,
  topNav = [],
  logoHref = "/",
  roleLabel,
  userName,
  userSubtitle,
  avatarUrl,
  children,
  sidebarFooterSlot,
  headerActions,
  notificationRole,
}: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    if (!navGroups) return new Set();
    const active = navGroups.find(g => g.items.some(i => pathname?.startsWith(i.href)));
    return active ? new Set([active.id]) : new Set(["prescricao"]);
  });

  function toggleGroup(id: string) {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  useEffect(() => {
    if (!navGroups) return;
    const active = navGroups.find(g => g.items.some(i => pathname?.startsWith(i.href)));
    if (active) setOpenGroups(prev => prev.has(active.id) ? prev : new Set([...prev, active.id]));
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

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

  function renderNavGroups(groups: NavGroup[], onClick?: () => void, forceExpanded = false) {
    const isCollapsedSidebar = collapsed && !forceExpanded;

    return groups.map((group) => {
      const isGroupOpen = openGroups.has(group.id);
      const isGroupActive = group.items.some(item => pathname?.startsWith(item.href));

      if (isCollapsedSidebar) {
        return (
          <button
            key={group.id}
            title={group.label}
            onClick={() => { setCollapsed(false); setOpenGroups(new Set([group.id])); }}
            className={cn(
              "flex w-full items-center justify-center rounded-xl py-2.5 px-2.5 transition-colors",
              isGroupActive ? "bg-primary/15 text-primary" : "text-text-muted hover:bg-card-hover hover:text-text"
            )}
          >
            <group.icon className="h-[18px] w-[18px] shrink-0" />
          </button>
        );
      }

      return (
        <div key={group.id}>
          <button
            onClick={() => toggleGroup(group.id)}
            className={cn(
              "group flex w-full items-center gap-2 rounded-xl px-3.5 py-2 transition-colors",
              isGroupActive ? "text-primary" : "text-text-muted hover:bg-card-hover hover:text-text"
            )}
          >
            <group.icon className={cn("h-4 w-4 shrink-0", isGroupActive ? "text-primary" : "")} />
            <span className="flex-1 text-left text-xs font-semibold uppercase tracking-[0.12em]">{group.label}</span>
            <ChevronRight className={cn("h-3.5 w-3.5 shrink-0 transition-transform duration-200", isGroupOpen ? "rotate-90" : "")} />
          </button>
          {isGroupOpen && (
            <div className="ml-2 mt-0.5 mb-1 space-y-0.5 border-l border-border/40 pl-3">
              {group.items.map(item => {
                const active = pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClick}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                      active ? "bg-primary/15 text-primary" : "text-text-muted hover:bg-card-hover hover:text-text"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-text-muted/70")} />
                    {item.label}
                    {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    });
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
        <div className={cn("flex items-center py-4 border-b border-border/40", collapsed ? "justify-center px-3" : "px-4")}>
          {!collapsed && <Link href={logoHref}><Logo size={32} /></Link>}
        </div>
        {!collapsed && (
          <p className="px-5 pt-3 pb-1 text-[10px] uppercase tracking-[0.16em] text-text-muted/70">{roleLabel}</p>
        )}

        <nav className="flex-1 overflow-y-auto space-y-0.5 px-3 pb-2 pt-1">
          {topNav.length > 0 && topNav.map((item) => renderNavItem(item))}
          {navGroups ? renderNavGroups(navGroups) : (
            <>
              {nav.map((item) => renderNavItem(item))}
              {moreNav.length > 0 && moreNav.map((item) => renderNavItem(item))}
            </>
          )}
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
              className="fixed inset-y-0 left-0 z-50 flex w-[min(288px,85vw)] flex-col border-r border-border bg-card lg:hidden"
            >
              {/* Header — fixo */}
              <div className="flex shrink-0 items-center justify-between px-6 py-4 border-b border-border/40">
                <Link href={logoHref} onClick={() => setMobileOpen(false)}><Logo size={30} /></Link>
                <div className="flex items-center gap-2">
                  <ThemeToggle inline />
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-card-hover hover:text-text"
                    aria-label="Fechar menu"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Nav — scrollável */}
              <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
                {topNav.length > 0 && topNav.map((item) => renderNavItem(item, () => setMobileOpen(false), true))}
                {navGroups ? renderNavGroups(navGroups, () => setMobileOpen(false), true) : (
                  <>
                    {nav.map((item) => renderNavItem(item, () => setMobileOpen(false), true))}
                    {moreNav.length > 0 && moreNav.map((item) => renderNavItem(item, () => setMobileOpen(false), true))}
                  </>
                )}
              </nav>

              {/* Footer — fixo */}
              <div className="shrink-0 border-t border-border/40 px-3 py-3">
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogout();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5 text-xs font-semibold text-danger transition-colors hover:border-danger/50 hover:bg-danger/5"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sair
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main column — provide drawer context so BottomNav can trigger it */}
      <AppShellDrawerContext.Provider value={{ openDrawer: () => setMobileOpen(true) }}>
      <div className="flex min-h-dvh flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-xl sm:px-6 print:hidden">
          {/* Desktop sidebar collapse toggle — visible only on lg+ */}
          <button
            className="hidden rounded-lg p-2 text-text-muted hover:bg-card hover:text-text lg:flex"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
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
            <NotificationBell role={notificationRole} />
            <Avatar className="h-9 w-9 lg:hidden">
              <AvatarImage src={avatarUrl} alt={userName} />
              <AvatarFallback>{userName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="flex-1 px-4 pb-24 pt-5 sm:px-6 lg:pb-10">{children}</main>
      </div>
      </AppShellDrawerContext.Provider>
    </div>
  );
}
