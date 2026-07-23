"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, LayoutDashboard, Users, ScrollText, ArrowLeft, Trophy, FileText } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Coin } from "@/components/ui/Coin";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Site Content", href: "/admin/content", icon: FileText },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Tournament", href: "/admin/tournament", icon: Trophy },
  { label: "Audit Log", href: "/admin/audit-log", icon: ScrollText },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) router.replace("/");
  }, [loading, user, router]);

  if (loading || !user || !user.isAdmin) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-lava-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-6">
        <Link
          href="/admin"
          className="font-heading flex items-center gap-2.5 text-base font-bold uppercase tracking-wide"
        >
          <Coin size="sm" />
          <span>
            Greek<span className="text-lava-400">God</span>Berry <span className="text-ash-400">Admin</span>
          </span>
        </Link>
        <Link
          href="/"
          className="font-heading flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-ash-300 transition-colors hover:text-white"
        >
          <ArrowLeft size={14} />
          Back to Site
        </Link>
      </div>

      <div className="mb-8">
        <p className="font-heading text-xs font-bold uppercase tracking-[0.3em] text-lava-500">Admin</p>
        <h1 className="text-ember text-3xl sm:text-4xl">Dashboard</h1>
      </div>

      {/* Mobile tab bar */}
      <div className="glass-panel mb-6 flex gap-1 overflow-x-auto rounded-xl p-1.5 lg:hidden">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "font-heading flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-colors",
                active ? "bg-lava-500/15 text-white" : "text-ash-300 hover:text-white"
              )}
            >
              <item.icon size={14} />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">
          <nav className="glass-panel sticky top-6 flex flex-col gap-1 rounded-xl p-2">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "font-heading flex items-center gap-2.5 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors",
                    active
                      ? "bg-lava-500/15 text-white"
                      : "text-ash-300 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <item.icon size={16} className={active ? "text-lava-400" : ""} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
