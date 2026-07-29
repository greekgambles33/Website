"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Radio, Lock, Dices, Users, Search, UserPlus, Shield } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { fetchAdminUsers } from "@/lib/adminApi";
import {
  fetchGiveaways,
  createGiveaway,
  deleteGiveaway,
  openGiveaway,
  closeGiveaway,
  drawGiveawayWinner,
  fetchGiveawayEntries,
  adminAddGiveawayEntry,
  adminRemoveGiveawayEntry,
  GiveawayApiError,
} from "@/lib/giveawaysApi";
import type { Giveaway, GiveawayEntry, GiveawayStatus, AdminUser } from "@/lib/api";

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
  const [requirementText, setRequirementText] = useState("");
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
        requirementText: requirementText || null,
        endsAt: endsAt || null,
      });
      setShowCreate(false);
      setTitle("");
      setDescription("");
      setEntryCost(0);
      setRequirementText("");
      setEndsAt("");
      await load();
    } catch (err) {
      alert(err instanceof GiveawayApiError ? err.message : "Failed to create");
    } finally {
      setBusy(false);
    }
  };

  const reloadEntries = useCallback(async (id: string) => {
    setEntries(await fetchGiveawayEntries(id));
  }, []);

  const toggleEntries = async (id: string) => {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    setExpanded(id);
    await reloadEntries(id);
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
            <div className="sm:col-span-2">
              <label className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-300">
                Eligibility Requirement (optional, shown to viewers)
              </label>
              <input
                value={requirementText}
                onChange={(e) => setRequirementText(e.target.value)}
                placeholder="e.g. Must have wagered $100+ in the last 7 days to qualify"
                className="ggb-input mt-1"
              />
              <p className="mt-1 text-xs text-ash-500">
                Not automatically checked — self-entry stays open, use &ldquo;Add&rdquo; in Manage Entries to only
                include people you&apos;ve confirmed qualify.
              </p>
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
                  {g.requirementText && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-gold-400">
                      <Shield size={12} /> {g.requirementText}
                    </p>
                  )}
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
                  <Users size={14} /> {expanded === g.id ? "Hide" : "Manage"} Entries
                </Button>
              </div>

              {expanded === g.id && (
                <EntryManager
                  giveaway={g}
                  entries={entries}
                  onChanged={() => reloadEntries(g.id)}
                  busy={busy}
                  setBusy={setBusy}
                />
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

function EntryManager({
  giveaway,
  entries,
  onChanged,
  busy,
  setBusy,
}: {
  giveaway: Giveaway;
  entries: GiveawayEntry[];
  onChanged: () => Promise<void>;
  busy: boolean;
  setBusy: (v: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminUser[]>([]);
  const [searching, setSearching] = useState(false);
  const locked = giveaway.status === "COMPLETED";

  useEffect(() => {
    if (!query.trim()) return;

    const timeout = setTimeout(() => {
      setSearching(true);
      fetchAdminUsers({ search: query.trim(), limit: 6 })
        .then((res) => setResults(res.users))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const enteredIds = new Set(entries.map((e) => e.userId));

  const handleAdd = async (userId: string) => {
    setBusy(true);
    try {
      await adminAddGiveawayEntry(giveaway.id, userId);
      setQuery("");
      setResults([]);
      await onChanged();
    } catch (err) {
      alert(err instanceof GiveawayApiError ? err.message : "Failed to add entry");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (entryId: string) => {
    setBusy(true);
    try {
      await adminRemoveGiveawayEntry(giveaway.id, entryId);
      await onChanged();
    } catch (err) {
      alert(err instanceof GiveawayApiError ? err.message : "Failed to remove entry");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3 border-t border-white/5 pt-3">
      {!locked && (
        <div className="relative">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ash-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a registered user by name to add them directly…"
              className="ggb-input pl-8"
            />
          </div>
          {query.trim() && (
            <div className="mt-1.5 space-y-1 rounded-lg border border-white/10 bg-ash-900/80 p-1.5">
              {searching ? (
                <p className="px-2 py-1.5 text-xs text-ash-500">Searching…</p>
              ) : results.length === 0 ? (
                <p className="px-2 py-1.5 text-xs text-ash-500">No matching users.</p>
              ) : (
                results.map((u) => (
                  <div key={u.id} className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-white/5">
                    <span className="text-xs text-ash-100">{u.displayName}</span>
                    {enteredIds.has(u.id) ? (
                      <span className="text-[10px] uppercase tracking-wide text-ash-500">Already entered</span>
                    ) : (
                      <button
                        disabled={busy}
                        onClick={() => handleAdd(u.id)}
                        className="font-heading flex items-center gap-1 rounded-full border border-lava-400/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-lava-300 hover:bg-lava-500/10 disabled:opacity-50"
                      >
                        <UserPlus size={11} /> Add
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-3 max-h-56 space-y-1 overflow-y-auto">
        {entries.length === 0 ? (
          <p className="text-xs text-ash-500">No entries yet.</p>
        ) : (
          entries.map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.03] px-3 py-2">
              <span className="flex items-center gap-2 text-xs text-ash-100">
                {e.user.displayName}
                {e.addedByAdmin && <Badge tone="gold">Admin-added</Badge>}
              </span>
              {!locked && (
                <button
                  onClick={() => handleRemove(e.id)}
                  aria-label="Remove entry"
                  disabled={busy}
                  className="rounded-full p-1.5 text-ash-500 hover:bg-crimson-500/10 hover:text-crimson-300 disabled:opacity-50"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
