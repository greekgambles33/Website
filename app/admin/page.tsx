"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Users, Coins, ShieldAlert, ShieldCheck, Crown, UserPlus, Link2, ArrowRight, Flame } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import type { AdminStats, AuditLogEntry } from "@/lib/api";
import { fetchAdminStats, fetchAuditLogs, AdminApiError } from "@/lib/adminApi";
import { formatAuditAction, timeAgo } from "@/lib/adminFormat";

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: typeof Users;
  label: string;
  value: string;
  tone?: "default" | "warn" | "gold";
}) {
  return (
    <GlassCard className="flex items-center gap-4">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
          tone === "warn"
            ? "bg-crimson-500/15 text-crimson-300"
            : tone === "gold"
              ? "bg-gold-500/15 text-gold-400"
              : "bg-lava-500/15 text-lava-300"
        }`}
      >
        <Icon size={18} />
      </div>
      <div>
        <p className="font-display text-2xl text-white">{value}</p>
        <p className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-300">{label}</p>
      </div>
    </GlassCard>
  );
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, logs] = await Promise.all([fetchAdminStats(), fetchAuditLogs({ page: 1, limit: 5 })]);
        if (cancelled) return;
        setStats(s);
        setRecentLogs(logs.logs);
      } catch (err) {
        if (!cancelled) setError(err instanceof AdminApiError ? err.message : "Failed to load dashboard data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 size={24} className="animate-spin text-lava-400" />
      </div>
    );
  }

  if (error || !stats) {
    return <p className="text-sm text-crimson-400">{error ?? "Something went wrong"}</p>;
  }

  return (
    <div className="space-y-8">
      <Link
        href="/hunt-tracker"
        className="group flex items-center justify-between gap-4 rounded-2xl border border-lava-400/25 bg-gradient-to-r from-lava-500/10 to-transparent p-5 transition-colors hover:border-lava-400/50"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-lava-500/15 text-lava-300">
            <Flame size={18} />
          </div>
          <div>
            <p className="font-semibold text-white">Bonus Hunt Tracker</p>
            <p className="text-xs text-ash-300">Build, run, and go live with a bonus hunt</p>
          </div>
        </div>
        <ArrowRight size={16} className="text-ash-400 transition-transform group-hover:translate-x-1" />
      </Link>

      <div>
        <h2 className="text-lg font-semibold text-white">Community at a glance</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} label="Total Users" value={stats.totalUsers.toLocaleString()} />
          <StatCard icon={Coins} label="Coins In Circulation" value={stats.totalCoinsInCirculation.toLocaleString()} tone="gold" />
          <StatCard icon={UserPlus} label="New This Week" value={stats.newUsersLast7Days.toLocaleString()} />
          <StatCard icon={ShieldAlert} label="Suspended" value={stats.suspendedCount.toLocaleString()} tone="warn" />
          <StatCard icon={Crown} label="Admins" value={stats.adminCount.toLocaleString()} tone="gold" />
          <StatCard icon={ShieldCheck} label="Moderators" value={stats.moderatorCount.toLocaleString()} />
          <StatCard icon={Link2} label="Kick Verified" value={stats.kickVerifiedCount.toLocaleString()} />
          <StatCard icon={Link2} label="Kick Pending" value={stats.kickPendingCount.toLocaleString()} tone="warn" />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
          <Link
            href="/admin/audit-log"
            className="font-heading flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-lava-300 hover:text-lava-200"
          >
            View All
            <ArrowRight size={12} />
          </Link>
        </div>

        <GlassCard className="mt-4 divide-y divide-white/5 p-0">
          {recentLogs.length === 0 ? (
            <p className="p-6 text-center text-sm text-ash-400">No admin activity yet.</p>
          ) : (
            recentLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div>
                  <p className="text-sm text-white">
                    <span className="font-semibold">{log.admin.displayName}</span>{" "}
                    <span className="text-ash-300">{formatAuditAction(log.action)}</span>
                    {log.target && <span className="font-semibold"> · {log.target.displayName}</span>}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-ash-500">{timeAgo(log.createdAt)}</span>
              </div>
            ))
          )}
        </GlassCard>
      </div>
    </div>
  );
}
