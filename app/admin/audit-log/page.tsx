"use client";

import { useEffect, useState } from "react";
import { Loader2, ChevronLeft, ChevronRight, ScrollText } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import type { AuditLogEntry } from "@/lib/api";
import { fetchAuditLogs, AdminApiError } from "@/lib/adminApi";
import { formatAuditAction, timeAgo } from "@/lib/adminFormat";

function detailSummary(details: Record<string, unknown> | null): string | null {
  if (!details) return null;
  const parts = Object.entries(details)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`);
  return parts.length > 0 ? parts.join(" · ") : null;
}

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchAuditLogs({ page, limit: 25 })
      .then((data) => {
        if (cancelled) return;
        setLogs(data.logs);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof AdminApiError ? err.message : "Failed to load audit log");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScrollText size={18} className="text-lava-400" />
          <h2 className="text-lg font-semibold text-white">Audit Log</h2>
        </div>
        <span className="text-xs text-ash-500">{total.toLocaleString()} entries</span>
      </div>

      <GlassCard className="p-0">
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <Loader2 size={24} className="animate-spin text-lava-400" />
          </div>
        ) : error ? (
          <p className="p-8 text-center text-sm text-crimson-400">{error}</p>
        ) : logs.length === 0 ? (
          <p className="p-8 text-center text-sm text-ash-400">No admin actions recorded yet.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {logs.map((log) => {
              const summary = detailSummary(log.details);
              return (
                <div key={log.id} className="flex flex-col gap-1 px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-white">
                      <span className="font-semibold">{log.admin.displayName}</span>{" "}
                      <span className="text-ash-300">{formatAuditAction(log.action)}</span>
                      {log.target && <span className="font-semibold"> · {log.target.displayName}</span>}
                    </p>
                    <span className="shrink-0 text-xs text-ash-500">{timeAgo(log.createdAt)}</span>
                  </div>
                  {summary && <p className="font-mono text-xs text-ash-500">{summary}</p>}
                </div>
              );
            })}
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
    </div>
  );
}
