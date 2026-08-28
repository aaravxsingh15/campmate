"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  GraduationCap,
  FileText,
  Sparkles,
  Dumbbell,
  CalendarDays,
  BarChart3,
  Settings,
  Menu,
  X,
  Search,
  Bell,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { Badge } from "@/components/ui";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/semester", label: "My Semester", icon: GraduationCap },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/ask", label: "Ask Camp Mate", icon: Sparkles },
  { href: "/practice", label: "Practice", icon: Dumbbell },
  { href: "/planner", label: "Planner", icon: CalendarDays },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({
  children,
  user,
  semesterLabel,
  isDemo,
}: {
  children: React.ReactNode;
  user: { name: string; email: string };
  semesterLabel: string;
  isDemo: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-1 flex-col gap-0.5 px-3">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={cn(
              "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-accent-soft text-accent"
                : "text-muted hover:bg-surface-2 hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <Link href="/dashboard" className="flex items-center gap-2.5 px-5 py-5">
      <span className="grid h-8 w-8 place-items-center rounded-md bg-accent font-mono text-sm font-bold text-black">
        C
      </span>
      <span className="text-sm font-semibold tracking-tight">Camp Mate</span>
    </Link>
  );

  return (
    <div className="flex min-h-screen w-full">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-surface lg:flex">
        {brand}
        {nav}
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-md px-3 py-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-surface-3 text-xs font-semibold">
              {initials(user.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-2">{user.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col border-r border-border bg-surface animate-in">
            <div className="flex items-center justify-between pr-3">
              {brand}
              <button onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5 text-muted" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
          <button
            className="lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5 text-muted" />
          </button>

          <Link
            href="/search"
            className="flex h-9 flex-1 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm text-muted-2 hover:border-border-strong sm:max-w-xs"
          >
            <Search className="h-4 w-4" />
            Search courses, topics, docs…
          </Link>

          <div className="flex items-center gap-3">
            <Badge tone="muted" className="hidden sm:inline-flex">
              {semesterLabel}
            </Badge>
            {isDemo && <Badge tone="accent">Demo data</Badge>}
            <button aria-label="Notifications" className="text-muted hover:text-foreground">
              <Bell className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
