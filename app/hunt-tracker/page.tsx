"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Trash2, Radio } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { fetchHunts, createHunt, deleteHunt, HuntApiError } from "@/lib/huntsApi";
import { formatCurrency } from "@/lib/utils";
import type { Hunt } from "@/lib/api";

const statusTone = { COLLECTING: "neutral", OPENING: "live", COMPLETED: "gold" } as const;

export default function HuntTrackerListPage() {
  const [hunts, setHunts] = useState<Hunt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchHunts();
      setHunts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof HuntApiError ? err.message : "Failed to load hunts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this hunt permanently? This cannot be undone.")) return;
    try {
      await deleteHunt(id);
      setHunts((prev) => prev.filter((h) => h.id !== id));
    } catch (err) {
      alert(err instanceof HuntApiError ? err.message : "Failed to delete hunt");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ash-300">{hunts.length} hunt{hunts.length === 1 ? "" : "s"} tracked</p>
        <button
          onClick={() => setShowCreate(true)}
          className="font-heading flex items-center gap-2 rounded-[10px] bg-gradient-to-b from-lava-300 to-lava-400 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[#140a04] shadow-[0_10px_30px_rgba(255,90,20,0.4)] hover:-translate-y-0.5"
        >
          <Plus size={15} />
          New Hunt
        </button>
      </div>

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2 size={24} className="animate-spin text-lava-400" />
        </div>
      ) : error ? (
        <p className="py-16 text-center text-sm text-crimson-400">{error}</p>
      ) : hunts.length === 0 ? (
        <GlassCard className="py-14 text-center text-sm text-ash-400">
          No hunts yet — create one to start tracking.
        </GlassCard>
      ) : (
        <GlassCard className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 text-xs uppercase tracking-widest text-ash-500">
                  <th className="px-5 py-3 font-semibold">Hunt</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Start</th>
                  <th className="px-5 py-3 font-semibold">Bonuses</th>
                  <th className="px-5 py-3 font-semibold" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {hunts.map((hunt) => (
                  <tr key={hunt.id} className="transition-colors hover:bg-white/[0.03]">
                    <td className="px-5 py-3.5">
                      <Link href={`/hunt-tracker/${hunt.id}`} className="font-medium text-white hover:text-lava-300">
                        {hunt.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Badge tone={statusTone[hunt.status]} pulse={hunt.status === "OPENING"}>
                          {hunt.status}
                        </Badge>
                        {hunt.isLive && (
                          <Badge tone="live" pulse className="gap-1">
                            <Radio size={10} /> Live
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-ash-300">{formatCurrency(hunt.startBalance, hunt.currency)}</td>
                    <td className="px-5 py-3.5 text-ash-300">{hunt.bonuses.length}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleDelete(hunt.id)}
                        aria-label="Delete hunt"
                        className="rounded-full p-2 text-ash-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {showCreate && (
        <CreateHuntModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function CreateHuntModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [startBalance, setStartBalance] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const balance = Number(startBalance);
    if (!name.trim()) return setError("Name is required");
    if (!Number.isFinite(balance) || balance < 0) return setError("Enter a valid start balance");

    setSubmitting(true);
    setError(null);
    try {
      await createHunt({ name: name.trim(), startBalance: balance, currency });
      onCreated();
    } catch (err) {
      setError(err instanceof HuntApiError ? err.message : "Failed to create hunt");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <GlassCard className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-white">New Hunt</h2>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-300">
              Hunt Name
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Friday Send"
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-ash-900/60 px-3.5 py-2.5 text-sm text-white placeholder:text-ash-500 focus:border-lava-500/50 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-[1fr_90px] gap-3">
            <div>
              <label className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-300">
                Start Balance
              </label>
              <input
                value={startBalance}
                onChange={(e) => setStartBalance(e.target.value)}
                placeholder="1000"
                inputMode="decimal"
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-ash-900/60 px-3.5 py-2.5 text-sm text-white placeholder:text-ash-500 focus:border-lava-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-300">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-ash-900/60 px-3 py-2.5 text-sm text-white focus:border-lava-500/50 focus:outline-none"
              >
                {["USD", "EUR", "GBP", "CAD", "AUD"].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="text-xs text-crimson-400">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-[10px] border border-white/10 py-2.5 text-xs font-semibold uppercase tracking-wide text-ash-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="font-heading flex-1 rounded-[10px] bg-gradient-to-b from-lava-300 to-lava-400 py-2.5 text-xs font-bold uppercase tracking-wide text-[#140a04] disabled:opacity-50"
            >
              {submitting ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
