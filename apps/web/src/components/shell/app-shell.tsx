"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, ChevronsUpDown, LogOut, Menu as MenuIcon, Monitor, Moon, Plus, Search, Shield, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { LogoMark } from "@/components/brand/logo";
import { Freshness } from "@/components/ui/identity";
import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { Sheet } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { api, orgPath } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/cn";
import { relativeTime } from "@/lib/format";
import { OrgProvider, ROLE_LABEL, useMe, useOrg } from "@/lib/org";
import { useTheme } from "@/lib/theme";
import type { AlertDto, OverviewDto } from "@/lib/types";
import { CommandPalette } from "./command-palette";
import { ALL_NAV, MOBILE_TABS, NAV, SECONDARY_NAV, type NavItem } from "./nav";

export function AppShell({ children }: { children: ReactNode }) {
  const me = useMe();
  const router = useRouter();

  useEffect(() => {
    if (me.data && me.data.organizations.length === 0) router.replace("/onboarding");
  }, [me.data, router]);

  if (me.isError && !me.isFetching) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas px-4">
        <div className="max-w-sm text-center" role="alert">
          <LogoMark className="mx-auto size-8" />
          <h1 className="mt-4 text-lg font-semibold">Can't reach TokenIQ right now</h1>
          <p className="mt-1 text-sm text-text-2">{(me.error as Error)?.message ?? "The service did not respond."} Nothing was changed.</p>
          <button onClick={() => me.refetch()} className="mt-4 inline-flex h-9 items-center rounded-[var(--radius-control)] bg-accent px-4 text-sm font-medium text-on-accent hover:bg-accent-hover">
            Try again
          </button>
          <p className="mt-3 text-xs text-text-3">
            Service status is at <a className="underline" href="/status">/status</a>.
          </p>
        </div>
      </div>
    );
  }
  if (me.isLoading || !me.data || me.data.organizations.length === 0) {
    return <ShellSkeleton label={me.isError ? "Couldn't load your account. Retrying…" : "Restoring your session…"} />;
  }
  return (
    <OrgProvider me={me.data}>
      <ShellFrame>{children}</ShellFrame>
    </OrgProvider>
  );
}

function useBadges() {
  const { orgId } = useOrg();
  const alerts = useQuery({ queryKey: ["org", orgId, "/alerts"], queryFn: () => api<{ alerts: AlertDto[] }>(orgPath(orgId, "/alerts")), staleTime: 60_000 });
  const approvals = useQuery({
    queryKey: ["org", orgId, "/proposals/summary"],
    queryFn: () => api<{ needsAttention: number }>(orgPath(orgId, "/proposals/summary")).catch(() => ({ needsAttention: 0 })),
    staleTime: 30_000,
  });
  return {
    alerts: alerts.data?.alerts.filter((a) => a.status === "open" && a.severity !== "info").length ?? 0,
    approvals: approvals.data?.needsAttention ?? 0,
  };
}

function isActive(pathname: string, href: string) {
  return href === "/app" ? pathname === "/app" : pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ item, pathname, badge, onNavigate, compact }: { item: NavItem; pathname: string; badge?: number; onNavigate?: () => void; compact?: boolean }) {
  const active = isActive(pathname, item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex h-8 items-center gap-2.5 rounded-[var(--radius-control)] px-2.5 text-[13.5px] transition-colors duration-[var(--dur-fast)]",
        active ? "bg-accent-subtle font-medium text-text" : "text-text-2 hover:bg-sunken hover:text-text",
        compact && "h-10",
      )}
    >
      <Icon className={cn("size-4 shrink-0", active ? "text-accent" : "text-text-3 group-hover:text-text-2")} aria-hidden="true" />
      <span className="truncate">{item.label}</span>
      {!!badge && (
        <span className="num ml-auto rounded-full bg-accent px-1.5 text-[11px] font-semibold leading-[18px] text-on-accent" aria-label={`${badge} need attention`}>
          {badge}
        </span>
      )}
    </Link>
  );
}

function OrgSwitcher() {
  const { me, org, switchOrg } = useOrg();
  const qc = useQueryClient();
  return (
    <Menu>
      <MenuTrigger asChild>
        <button className="flex w-full min-w-0 items-center gap-2 rounded-[var(--radius-control)] px-2 py-1.5 text-left hover:bg-sunken" aria-label={`Organization: ${org.name}. Switch organization`}>
          <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center rounded-[5px] bg-sunken text-[11px] font-semibold text-text-2 ring-1 ring-hairline">
            {org.name.slice(0, 2).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium text-text">{org.name}</span>
            <span className="block text-[11px] text-text-3">{org.isSample ? "Sample workspace" : ROLE_LABEL[org.role]}</span>
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-text-3" aria-hidden="true" />
        </button>
      </MenuTrigger>
      <MenuContent align="start" className="w-64">
        <MenuLabel>Organizations</MenuLabel>
        {me.organizations.map((o) => (
          <MenuItem
            key={o.id}
            onSelect={() => {
              switchOrg(o.id);
              qc.removeQueries({ queryKey: ["org"] });
            }}
          >
            <span className="min-w-0 flex-1 truncate">{o.name}</span>
            {o.isSample && <span className="text-[11px] text-text-3">Sample</span>}
            {o.id === org.id && <Check className="size-3.5 text-accent" aria-label="Current" />}
          </MenuItem>
        ))}
        <MenuSeparator />
        <MenuItem onSelect={() => (window.location.href = "/onboarding/organization?new=1")}>
          <Plus className="size-3.5" aria-hidden="true" /> New organization
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

function AccountMenu() {
  const { me } = useOrg();
  const { pref, setPref } = useTheme();
  const qc = useQueryClient();
  const initials = (me.user.name || me.user.email).slice(0, 2).toUpperCase();
  return (
    <Menu>
      <MenuTrigger asChild>
        <button className="flex size-8 items-center justify-center rounded-full bg-sunken text-[11px] font-semibold text-text-2 ring-1 ring-hairline hover:ring-border-strong" aria-label="Account menu">
          {initials}
        </button>
      </MenuTrigger>
      <MenuContent className="w-60">
        <div className="px-2 py-1.5">
          <div className="truncate text-sm font-medium text-text">{me.user.name}</div>
          <div className="truncate text-xs text-text-3">{me.user.hasRealEmail ? me.user.email : "Signed in with a wallet"}</div>
        </div>
        <MenuSeparator />
        <MenuLabel>Theme</MenuLabel>
        {(
          [
            ["light", "Light", Sun],
            ["dark", "Dark", Moon],
            ["system", "System", Monitor],
          ] as const
        ).map(([v, label, Icon]) => (
          <MenuItem key={v} onSelect={() => setPref(v)}>
            <Icon className="size-3.5" aria-hidden="true" /> {label}
            {pref === v && <Check className="ml-auto size-3.5 text-accent" aria-label="Selected" />}
          </MenuItem>
        ))}
        <MenuSeparator />
        <MenuItem onSelect={() => (window.location.href = "/app/settings?tab=security")}>
          <Shield className="size-3.5" aria-hidden="true" /> Security and sessions
        </MenuItem>
        <MenuItem
          onSelect={async () => {
            await authClient.signOut();
            qc.clear();
            window.location.href = "/login?reason=signed_out";
          }}
        >
          <LogOut className="size-3.5" aria-hidden="true" /> Sign out
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

function NotificationsButton() {
  const { orgId } = useOrg();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["org", orgId, "/notifications"], queryFn: () => api<{ notifications: Array<{ id: string; title: string; body: string | null; link: string | null; readAt: string | null; createdAt: string }>; unread: number }>(orgPath(orgId, "/notifications")), refetchInterval: 120_000 });
  const unread = q.data?.unread ?? 0;
  return (
    <Menu
      onOpenChange={async (open) => {
        if (!open && unread > 0) {
          await api(orgPath(orgId, "/notifications/read"), { method: "POST", body: {} }).catch(() => undefined);
          qc.invalidateQueries({ queryKey: ["org", orgId, "/notifications"] });
        }
      }}
    >
      <MenuTrigger asChild>
        <button className="relative flex size-8 items-center justify-center rounded-[var(--radius-control)] text-text-2 hover:bg-sunken hover:text-text" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}>
          <Bell className="size-4" aria-hidden="true" />
          {unread > 0 && <span aria-hidden="true" className="absolute right-1.5 top-1.5 size-2 rounded-full bg-danger ring-2 ring-canvas" />}
        </button>
      </MenuTrigger>
      <MenuContent className="w-80">
        <MenuLabel>Notifications</MenuLabel>
        {(q.data?.notifications.length ?? 0) === 0 && <div className="px-2 py-4 text-center text-[13px] text-text-2">You're up to date. Alerts and approval requests appear here.</div>}
        {q.data?.notifications.slice(0, 8).map((n) => (
          <MenuItem key={n.id} onSelect={() => n.link && (window.location.href = n.link)}>
            <span className={cn("mt-1 size-1.5 shrink-0 self-start rounded-full", n.readAt ? "bg-transparent" : "bg-accent")} aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium">{n.title}</span>
              {n.body && <span className="line-clamp-2 block text-xs text-text-2">{n.body}</span>}
              <span className="block text-[11px] text-text-3">{relativeTime(n.createdAt)}</span>
            </span>
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  );
}

function ShellFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { org, orgId } = useOrg();
  const badges = useBadges();
  const [moreOpen, setMoreOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const overview = useQuery({ queryKey: ["org", orgId, "/treasury"], queryFn: () => api<OverviewDto>(orgPath(orgId, "/treasury")), staleTime: 30_000 });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const current = ALL_NAV.find((n) => isActive(pathname, n.href));

  return (
    <div className="min-h-dvh bg-canvas">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[232px] flex-col border-r border-hairline bg-canvas lg:flex" aria-label="Primary">
        <div className="flex h-14 items-center gap-2 px-4">
          <Link href="/app" className="flex items-center gap-2" aria-label="TokenIQ overview">
            <LogoMark />
            <span className="text-[15px] font-semibold tracking-[-0.02em]">TokenIQ</span>
          </Link>
        </div>
        <div className="px-2.5">
          <OrgSwitcher />
        </div>
        <nav className="mt-3 flex-1 space-y-4 overflow-y-auto px-2.5 pb-4">
          {NAV.map((g, i) => (
            <div key={i}>
              {g.label && <div className="px-2.5 pb-1 text-[11px] font-medium uppercase tracking-[0.06em] text-text-3">{g.label}</div>}
              <div className="space-y-0.5">
                {g.items.map((item) => (
                  <NavLink key={item.href} item={item} pathname={pathname} badge={item.badge ? badges[item.badge] : undefined} />
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="space-y-0.5 border-t border-hairline px-2.5 py-3">
          {SECONDARY_NAV.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>
      </aside>

      <div className="lg:pl-[232px]">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-hairline bg-canvas/95 pt-safe backdrop-blur-[2px] supports-[backdrop-filter]:bg-canvas/85">
          <div className="flex h-14 items-center gap-2 px-4 sm:px-6">
            <Link href="/app" className="flex items-center gap-2 lg:hidden" aria-label="TokenIQ overview">
              <LogoMark />
            </Link>
            <div className="min-w-0 flex-1 lg:hidden">
              <div className="truncate text-[13px] font-medium">{org.name}</div>
              <div className="truncate text-[11px] text-text-3">{current?.label ?? "TokenIQ"}</div>
            </div>
            <button
              onClick={() => setPaletteOpen(true)}
              className="hidden h-8 w-72 items-center gap-2 rounded-[var(--radius-control)] border border-hairline bg-surface px-2.5 text-[13px] text-text-3 hover:border-border-strong/60 lg:flex"
              aria-label="Search or jump to (Command K)"
            >
              <Search className="size-3.5" aria-hidden="true" />
              Search or jump to…
              <kbd className="ml-auto rounded border border-hairline px-1 font-mono text-[10px]">⌘K</kbd>
            </button>
            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <span className="hidden md:inline-flex">
                <Freshness at={overview.data?.lastObservedAt ?? null} staleAfterMinutes={60} />
              </span>
              <button onClick={() => setPaletteOpen(true)} className="flex size-8 items-center justify-center rounded-[var(--radius-control)] text-text-2 hover:bg-sunken lg:hidden" aria-label="Search">
                <Search className="size-4" aria-hidden="true" />
              </button>
              <NotificationsButton />
              <AccountMenu />
            </div>
          </div>
          {org.isSample && (
            <div className="border-t border-warning/30 bg-warning-subtle px-4 py-1.5 text-center text-xs font-medium text-warning sm:px-6">
              Sample workspace — every balance, obligation and venue figure here is simulated. Nothing can be signed or executed.
            </div>
          )}
        </header>

        <main id="main" className="mx-auto w-full max-w-[1440px] px-4 pb-28 pt-5 sm:px-6 lg:pb-12">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-canvas pb-safe lg:hidden" aria-label="Primary">
        <div className="grid grid-cols-5">
          {MOBILE_TABS.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            const badge = item.badge ? badges[item.badge] : 0;
            return (
              <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cn("relative flex h-14 flex-col items-center justify-center gap-0.5 text-[11px]", active ? "font-medium text-accent" : "text-text-2")}>
                <Icon className="size-5" aria-hidden="true" />
                {item.label}
                {!!badge && (
                  <span className="num absolute right-[22%] top-2 rounded-full bg-accent px-1 text-[10px] font-semibold leading-4 text-on-accent" aria-label={`${badge} need attention`}>
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
          <button onClick={() => setMoreOpen(true)} className="flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] text-text-2" aria-haspopup="dialog">
            <MenuIcon className="size-5" aria-hidden="true" />
            More
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen} title="All sections">
        <div className="mb-4">
          <OrgSwitcher />
        </div>
        <div className="space-y-4">
          {NAV.map((g, i) => (
            <div key={i}>
              {g.label && <div className="px-2.5 pb-1 text-[11px] font-medium uppercase tracking-[0.06em] text-text-3">{g.label}</div>}
              {g.items.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} compact badge={item.badge ? badges[item.badge] : undefined} onNavigate={() => setMoreOpen(false)} />
              ))}
            </div>
          ))}
          <div className="border-t border-hairline pt-3">
            {SECONDARY_NAV.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} compact onNavigate={() => setMoreOpen(false)} />
            ))}
          </div>
        </div>
      </Sheet>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}

function ShellSkeleton({ label }: { label: string }) {
  return (
    <div className="min-h-dvh bg-canvas" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <aside className="fixed inset-y-0 left-0 hidden w-[232px] border-r border-hairline lg:block">
        <div className="space-y-3 p-4">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-9 w-full" />
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      </aside>
      <div className="lg:pl-[232px]">
        <div className="flex h-14 items-center border-b border-hairline px-6">
          <Skeleton className="h-8 w-72" />
        </div>
        <div className="mx-auto max-w-[1440px] space-y-4 px-4 pt-6 sm:px-6">
          <p className="text-[13px] text-text-3">{label}</p>
          <Skeleton className="h-40 w-full" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
        </div>
      </div>
    </div>
  );
}
