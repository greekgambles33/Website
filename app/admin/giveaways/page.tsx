"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Radio, Lock, Dices, Users } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  fetchGiveaways,
  createGiveaway,
  deleteGiveaway,
  openGiveaway,
  closeGiveaway,
  drawGiveawayWinner,
  fetchGiveawayEntries,
  GiveawayApiError,
} from "@/lib/giveawaysApi";
import type { Giveaway, GiveawayEntry, GiveawayStatus } from "@/lib/api";

const statusTone: Record<GiveawayStatus, "neutral" | "live" | "lava" | "gold"> = {
  DRAFT: "neutral",
  OPEN: "live",
  CLOSED: "lava",
  COMPLETED: "gold",
};

export default function AdminGiveawaysPage() {
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [entries, setEntries] = useState<GiveawayEntry[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [entryCost, setEntryCost] = useState(0);
  const [endsAt, setEndsAt] = useState("");

  const load = useCallback(async () => {
    try {
      setGiveaways(await fetchGiveaways());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runAction = async (action: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await action();
      await load();
    } catch (err) {
      alert(err instanceof GiveawayApiError ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async () => {
    setBusy(true);
    try {
      await createGiveaway({
        title,
        description: description || null,
        entryCost: entryCost || 0,
        endsAt: endsAt || null,
      });
      setShowCreate(false);
      setTitle("");
      setDescription("");
      setEntryCost(0);
      setEndsAt("");
      await load();
    } catch (err) {
      alert(err instanceof GiveawayApiError ? err.message : "Failed to create");
    } finally {
      setBusy(false);
    }
  };

  const toggleEntries = async (id: string) => {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    setExpanded(id);
    setEntries(await fetchGiveawayEntries(id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ash-300">{giveaways.length} giveaway{giveaways.length === 1 ? "" : "s"}</p>
        <Button size="sm" onClick={() => setShowCreate((v) => !v)}>
          <Plus size={15} /> New Giveaway
        </Button>
      </div>

      {showCreate && (
        <GlassCard>
          <h3 className="font-heading text-sm font-semibold uppercase tracking-widest text-ash-100">New Giveaway</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-300">Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="ggb-input mt-1" />
            </div>
            <div className="sm:col-span-2">
              <label className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-300">
                Description
              </label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="ggb-input mt-1" />
            </div>
            <div>
              <label className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-300">
                Entry Cost (0 = free)
              </label>
              <input
                type="number"
                min={0}
                value={entryCost}
                onChange={(e) => setEntryCost(Number(e.target.value))}
                className="ggb-input mt-1"
              />
            </div>
            <div>
              <label className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-300">
                Ends At (optional)
              </label>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="ggb-input mt-1"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button size="sm" disabled={busy || !title} onClick={handleCreate}>
              Create
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
          </div>
        </GlassCard>
      )}

      {loading ? (
        <div className="flex min-h-[240px] items-center justify-center">
          <Loader2 size={24} className="animate-spin text-lava-400" />
        </div>
      ) : giveaways.length === 0 ? (
        <GlassCard className="py-14 text-center text-sm text-ash-400">No giveaways yet.</GlassCard>
      ) : (
        <div className="space-y-4">
          {giveaways.map((g) => (
            <GlassCard key={g.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge tone={statusTone[g.status]} pulse={g.status === "OPEN"}>
                      {g.status}
                    </Badge>
                    <h3 className="font-heading text-sm font-bold text-white">{g.title}</h3>
                  </div>
                  {g.description && <p className="mt-1.5 text-sm text-ash-300">{g.description}</p>}
                  <p className="mt-1.5 text-xs text-ash-400">
                    {g._count.entries} entries · {g.entryCost > 0 ? `${g.entryCost} coins to enter` : "free entry"}
                    {g.winner && ` · won by ${g.winner.displayName}`}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (confirm("Delete this giveaway permanently?")) runAction(() => deleteGiveaway(g.id));
                  }}
                  aria-label="Delete giveaway"
                  className="rounded-full p-2 text-ash-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-white/5 pt-4">
                {g.status === "DRAFT" && (
                  <Button size="sm" disabled={busy} onClick={() => runAction(() => openGiveaway(g.id))}>
                    <Radio size={14} /> Open Entries
                  </Button>
                )}
                {g.status === "OPEN" && (
                  <Button size="sm" variant="secondary" disabled={busy} onClick={() => runAction(() => closeGiveaway(g.id))}>
                    <Lock size={14} /> Close Entries
                  </Button>
                )}
                {(g.status === "OPEN" || g.status === "CLOSED") && (
                  <Button
                    size="sm"
                    disabled={busy || g._count.entries === 0}
                    onClick={() => {
                      if (confirm(`Draw a winner from ${g._count.entries} entries?`)) runAction(() => drawGiveawayWinner(g.id));
                    }}
                  >
                    <Dices size={14} /> Draw Winner
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => toggleEntries(g.id)}>
                  <Users size={14} /> {expanded === g.id ? "Hide" : "View"} Entries
                </Button>
              </div>

              {expanded === g.id && (
                <div className="mt-3 max-h-48 space-y-1 overflow-y-auto border-t border-white/5 pt-3">
                  {entries.length === 0 ? (
                    <p className="text-xs text-ash-500">No entries yet.</p>
                  ) : (
                    entries.map((e) => (
                      <p key={e.id} className="text-xs text-ash-300">
                        {e.user.displayName}
                      </p>
                    ))
                  )}
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
