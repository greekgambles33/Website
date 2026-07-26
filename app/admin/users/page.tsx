"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { AdminUser } from "@/lib/api";
import { fetchAdminUsers, AdminApiError, type UserFilter } from "@/lib/adminApi";
import { UserDetailDrawer } from "@/components/admin/UserDetailDrawer";

const FILTERS: { label: string; value: UserFilter }[] = [
  { label: "All", value: "all" },
  { label: "Suspended", value: "suspended" },
  { label: "Admins", value: "admins" },
  { label: "Moderators", value: "moderators" },
  { label: "Kick Pending", value: "kick_pending" },
  { label: "Twitch Pending", value: "twitch_pending" },
];

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<UserFilter>("all");
  const [page, setPage] = useState(1);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filter]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminUsers({ search: debouncedSearch, filter, page, limit: 20 });
      setUsers(data.users);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filter, page]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ash-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, Kick, Twitch, or Discord ID"
            className="w-full rounded-full border border-white/10 bg-ash-900/60 py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-ash-500 focus:border-lava-500/50 focus:outline-none"
          />
        </div>
        <span className="text-xs text-ash-500">{total.toLocaleString()} total</span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "font-heading shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors",
              filter === f.value
                ? "border-lava-400/60 bg-lava-500/15 text-white"
                : "border-white/10 text-ash-300 hover:text-white"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <GlassCard className="p-0">
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <Loader2 size={24} className="animate-spin text-lava-400" />
          </div>
        ) : error ? (
          <p className="p-8 text-center text-sm text-crimson-400">{error}</p>
        ) : users.length === 0 ? (
          <p className="p-8 text-center text-sm text-ash-400">No users match your filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 text-xs uppercase tracking-widest text-ash-500">
                  <th className="px-5 py-3 font-semibold">User</th>
                  <th className="px-5 py-3 font-semibold">Balance</th>
                  <th className="px-5 py-3 font-semibold">Kick</th>
                  <th className="px-5 py-3 font-semibold">Twitch</th>
                  <th className="px-5 py-3 font-semibold">Roles</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => setSelectedUserId(u.id)}
                    className="cursor-pointer transition-colors hover:bg-white/[0.03]"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {u.avatarUrl ? (
                          <Image src={u.avatarUrl} alt={u.displayName} width={32} height={32} className="rounded-full" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-crimson-600 text-xs font-bold text-white">
                            {u.displayName.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium text-white">{u.displayName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-lava-300">{u.catCoinBalance.toLocaleString()}</td>
                    <td className="px-5 py-3.5">
                      {u.kickUsername ? (
                        <Badge tone={u.kickVerified ? "lava" : "neutral"}>
                          {u.kickVerified ? "Verified" : "Pending"}
                        </Badge>
                      ) : (
                        <span className="text-ash-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {u.twitchUsername ? (
                        <Badge tone={u.twitchVerified ? "lava" : "neutral"}>
                          {u.twitchVerified ? "Verified" : "Pending"}
                        </Badge>
                      ) : (
                        <span className="text-ash-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1.5">
                        {u.isAdmin && <Badge tone="gold">Admin</Badge>}
                        {u.isModerator && <Badge tone="lava">Mod</Badge>}
                        {!u.isAdmin && !u.isModerator && <span className="text-ash-600">—</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {u.isSuspended ? <Badge tone="live">Suspended</Badge> : <Badge tone="neutral">Active</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-ash-300 disabled:opacity-40 hover:text-white"
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <span className="text-xs text-ash-400">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-ash-300 disabled:opacity-40 hover:text-white"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}

      {selectedUserId && (
        <UserDetailDrawer
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}
