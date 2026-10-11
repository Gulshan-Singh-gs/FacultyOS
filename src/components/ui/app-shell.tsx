"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/server/auth/client";

import {
  LayoutDashboard,
  BookOpen,
  Inbox as InboxIcon,
  Clock,
  ScrollText,
  LogOut,
  Menu,
  X,
  Plus,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { FacultyLogo } from "@/components/ui/faculty-logo";

interface AppShellProps {
  children: React.ReactNode;
  user: {
    id: string;
    email: string;
    name: string;
    image?: string | null;
  };
  profile: {
    id: string;
    displayName: string;
    plan: string;
    institution?: string | null;
    facultyTitle?: string | null;
  };
}

const NAV_ITEMS = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Courses",
    href: "/courses",
    icon: BookOpen,
  },
  {
    name: "Inbox",
    href: "/inbox",
    icon: InboxIcon,
  },
  {
    name: "Boundaries",
    href: "/boundaries",
    icon: Clock,
  },
  {
    name: "Career Ledger",
    href: "/ledger",
    icon: ScrollText,
  },
];

export function AppShell({ children, user, profile }: AppShellProps) {
  const rawPathname = usePathname();
  const pathname = rawPathname || "";
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      router.push("/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg-base)] text-[var(--text-primary)]">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:w-64 flex-col justify-between p-4 card-neu m-4 mr-0">
        <div className="space-y-6">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 px-3 py-2">
            <FacultyLogo size={36} />
            <div>
              <div className="font-semibold text-base tracking-tight text-[var(--text-primary)]">
                FacultyOS
              </div>
              <div className="text-xs text-[var(--text-secondary)]">
                {profile?.facultyTitle || "Professor"}
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5" aria-label="Main Navigation">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : Boolean(pathname && pathname.startsWith(item.href));
              const IconComp = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[var(--bg-surface-elevated)] text-[var(--brand)] border-l-2 border-[var(--brand)] font-semibold"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]"
                  }`}
                >
                  <span className={isActive ? "text-[var(--brand)]" : "text-[var(--text-muted)]"}>
                    <IconComp className="w-5 h-5" strokeWidth={1.75} />
                  </span>
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer / Profile Info */}
        <div className="pt-4 border-t border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)] space-y-3">
          <div className="px-3 py-2 rounded-xl bg-[var(--bg-input)] flex items-center justify-between">
            <div className="truncate">
              <div className="text-xs font-medium text-[var(--text-primary)] truncate">
                {profile?.displayName || "Professor"}
              </div>
              <div className="text-[11px] text-[var(--text-secondary)] truncate">
                {user?.email || ""}
              </div>
            </div>
            <span className="glass-badge capitalize">
              {profile?.plan || "free"}
            </span>
          </div>

          <button
            onClick={handleSignOut}
            disabled={loggingOut}
            className="w-full btn-ghost py-2 text-xs flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.75} />
            {loggingOut ? "Signing out..." : "Sign Out"}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Floating Glass Top Bar */}
        <header className="sticky top-0 z-30 mx-4 mt-4 glass-panel px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" strokeWidth={1.75} />
            </button>
            <span className="text-sm font-semibold text-[var(--text-primary)] capitalize">
              {pathname === "/dashboard"
                ? "Overview"
                : pathname ? pathname.split("/")[1] || "Dashboard" : "Dashboard"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle size="sm" />
            <Link
              href="/courses"
              className="btn-primary text-xs px-3.5 py-1.5 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2} />
              New Course
            </Link>
          </div>
        </header>

        {/* Mobile Nav Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm p-4 flex flex-col justify-between">
            <div className="card-neu p-4 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)]">
                <div className="flex items-center gap-2">
                  <FacultyLogo size={24} />
                  <span className="font-bold text-base">FacultyOS</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-[var(--text-secondary)]"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" strokeWidth={1.75} />
                </button>
              </div>
              <nav className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const IconComp = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm"
                    >
                      <IconComp className="w-5 h-5" strokeWidth={1.75} />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 min-w-0">{children}</main>
      </div>
    </div>
  );
}
