"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Radio, RadioTower, Pencil, FlagOff, Trophy } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import {
  fetchWagerLeaderboards,
  fetchArchivedWagerLeaderboards,
  createWagerLeaderboard,
  updateWagerLeaderboard,
  deleteWagerLeaderboard,
  addWagerEntry,
  editWagerEntry,
  removeWagerEntry,
  setWagerLeaderboardLive,
  unsetWagerLeaderboardLive,
  archiveWagerLeaderboard,
  WagerLeaderboardApiError,
} from "@/lib/wagerLeaderboardApi";
import type { WagerLeaderboard, WagerEntry, WagerPrizeTier } from "@/lib/api";

function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

/** Editable list of { rank, amount } rows, kept sorted by rank. */
function PrizeDistributionEditor({
  tiers,
  onChange,
}: {
  tiers: WagerPrizeTier[];
  onChange: (tiers: WagerPrizeTier[]) => void;
}) {
  const addTier = () => {
    const nextRank = tiers.length ? Math.max(...tiers.map((t) => t.rank)) + 1 : 1;
    onChange([...tiers, { rank: nextRank, amount: 0 }].sort((a, b) => a.rank - b.rank));
  };

  const updateTier = (index: number, patch: Partial<WagerPrizeTier>) => {
    const next = [...tiers];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const removeTier = (index: number) => {
    onChange(tiers.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-300">
          Prize Distribution (optional)
        </label>
        <button
          type="button"
          onClick={addTier}
          className="font-heading flex items-center gap-1 text-xs text-lava-300 hover:text-lava-200"
        >
          <Plus size={12} /> Add Tier
        </button>
      </div>
      {tiers.length === 0 ? (
        <p className="mt-1 text-xs text-ash-500">Leave empty for winner-takes-all of the prize amount.</p>
      ) : (
        <div className="mt-2 space-y-1.5">
          {tiers.map((tier, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <select
                value={tier.rank}
                onChange={(e) => updateTier(i, { rank: Number(e.target.value) })}
                className="ggb-input w-24 py-1 text-xs"
              >
                {Array.from({ length: 20 }, (_, n) => n + 1).map((n) => (
                  <option key={n} value={n}>
                    {ordinal(n)} place
                  </option>
                ))}
              </select>
              <input
                value={tier.amount}
                onChange={(e) => updateTier(i, { amount: Number(e.target.value) || 0 })}
                inputMode="decimal"
                placeholder="Amount"
                className="ggb-input flex-1 py-1 text-xs"
              />
              <button
                type="button"
                onClick={() => removeTier(i)}
                aria-label="Remove tier"
                className="rounded-full p-1.5 text-ash-500 hover:bg-crimson-500/10 hover:text-crimson-300"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminWagerLeaderboardPage() {
  const [tab, setTab] = useState<"active" | "past">("active");
  const [boards, setBoards] = useState<WagerLeaderboard[]>([]);
  const [archived, setArchived] = useState<WagerLeaderboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [startsAtDraft, setStartsAtDraft] = useState("");
  const [endsAtDraft, setEndsAtDraft] = useState("");
  const [editingPrizeId, setEditingPrizeId] = useState<string | null>(null);
  const [prizeDraft, setPrizeDraft] = useState<WagerPrizeTier[]>([]);

  const [title, setTitle] = useState("");
  const [prizeAmount, setPrizeAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [newPrizeTiers, setNewPrizeTiers] = useState<WagerPrizeTier[]>([]);

  const load = useCallback(async () => {
    try {
      const [active, past] = await Promise.all([fetchWagerLeaderboards(), fetchArchivedWagerLeaderboards()]);
      setBoards(active);
      setArchived(past);
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
      alert(err instanceof WagerLeaderboardApiError ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async () => {
    const amount = Number(prizeAmount);
    if (!Number.isFinite(amount) || amount < 0) return alert("Enter a valid prize amount");
    setBusy(true);
    try {
      await createWagerLeaderboard({
        title: title || null,
        prizeAmount: amount,
        currency,
        startsAt: startsAt ? new Date(startsAt).toISOString() : null,
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
        prizeDistribution: newPrizeTiers.length ? newPrizeTiers : null,
      });
      setShowCreate(false);
      setTitle("");
      setPrizeAmount("");
      setCurrency("USD");
      setStartsAt("");
      setEndsAt("");
      setNewPrizeTiers([]);
      await load();
    } catch (err) {
      alert(err instanceof WagerLeaderboardApiError ? err.message : "Failed to create");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveSchedule = async (board: WagerLeaderboard) => {
    await runAction(() =>
      updateWagerLeaderboard(board.id, {
        startsAt: startsAtDraft ? new Date(startsAtDraft).toISOString() : null,
        endsAt: endsAtDraft ? new Date(endsAtDraft).toISOString() : null,
      })
    );
    setEditingScheduleId(null);
  };

  const handleSavePrizeDistribution = async (board: WagerLeaderboard) => {
    await runAction(() => updateWagerLeaderboard(board.id, { prizeDistribution: prizeDraft.length ? prizeDraft : null }));
    setEditingPrizeId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setTab("active")}
          className={`font-heading rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide ${
            tab === "active" ? "border-lava-400/40 bg-lava-500/10 text-lava-300" : "border-white/10 text-ash-400 hover:text-white"
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setTab("past")}
          className={`font-heading flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide ${
            tab === "past" ? "border-gold-400/40 bg-gold-500/10 text-gold-300" : "border-white/10 text-ash-400 hover:text-white"
          }`}
        >
          <Trophy size={12} /> Past Winners
        </button>
      </div>

      {tab === "active" ? (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-ash-300">{boards.length} leaderboard{boards.length === 1 ? "" : "s"}</p>
            <Button size="sm" onClick={() => setShowCreate((v) => !v)}>
              <Plus size={15} /> New Leaderboard
            </Button>
          </div>

          {showCreate && (
            <GlassCard>
              <h3 className="font-heading text-sm font-semibold uppercase tracking-widest text-ash-100">New Wager Leaderboard</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-300">
                    Prize Amount
                  </label>
                  <input value={prizeAmount} onChange={(e) => setPrizeAmount(e.target.value)} placeholder="250" inputMode="decimal" className="ggb-input mt-1" />
                </div>
                <div>
                  <label className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-300">Currency</label>
                  <input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} placeholder="USD" className="ggb-input mt-1" />
                </div>
                <div>
                  <label className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-300">
                    Title Override (optional)
                  </label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Auto: $250 Leaderboard" className="ggb-input mt-1" />
                </div>
                <div>
                  <label className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-300">
                    Starts At (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
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
              <div className="mt-4">
                <PrizeDistributionEditor tiers={newPrizeTiers} onChange={setNewPrizeTiers} />
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" disabled={busy || !prizeAmount} onClick={handleCreate}>
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
          ) : boards.length === 0 ? (
            <GlassCard className="py-14 text-center text-sm text-ash-400">No wager leaderboards yet.</GlassCard>
          ) : (
            <div className="space-y-4">
              {boards.map((board) => (
                <GlassCard key={board.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        {board.isLive && (
                          <Badge tone="live" pulse>
                            Live
                          </Badge>
                        )}
                        <h3 className="font-heading text-sm font-bold text-white">{board.displayTitle}</h3>
                      </div>
                      <p className="mt-1.5 text-xs text-ash-400">{board.entries.length} entries</p>

                      {editingScheduleId === board.id ? (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <div className="flex flex-col gap-1">
                            <span className="font-heading text-[10px] uppercase tracking-widest text-ash-500">Starts</span>
                            <input
                              type="datetime-local"
                              autoFocus
                              value={startsAtDraft}
                              onChange={(e) => setStartsAtDraft(e.target.value)}
                              className="ggb-input w-56 py-1 text-xs"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="font-heading text-[10px] uppercase tracking-widest text-ash-500">Ends</span>
                            <input
                              type="datetime-local"
                              value={endsAtDraft}
                              onChange={(e) => setEndsAtDraft(e.target.value)}
                              className="ggb-input w-56 py-1 text-xs"
                            />
                          </div>
                          <Button size="sm" disabled={busy} onClick={() => handleSaveSchedule(board)}>
                            Save
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => setEditingScheduleId(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingScheduleId(board.id);
                            setStartsAtDraft(toDatetimeLocalValue(board.startsAt));
                            setEndsAtDraft(toDatetimeLocalValue(board.endsAt));
                          }}
                          className="font-heading mt-2 flex items-center gap-1 text-xs text-ash-400 hover:text-white"
                        >
                          <Pencil size={11} />
                          {board.startsAt || board.endsAt
                            ? [
                                board.startsAt && `Starts ${new Date(board.startsAt).toLocaleString()}`,
                                board.endsAt && `Ends ${new Date(board.endsAt).toLocaleString()}`,
                              ]
                                .filter(Boolean)
                                .join(" · ")
                            : "Set start / end time"}
                        </button>
                      )}

                      {editingPrizeId === board.id ? (
                        <div className="mt-3 max-w-sm">
                          <PrizeDistributionEditor tiers={prizeDraft} onChange={setPrizeDraft} />
                          <div className="mt-2 flex gap-1.5">
                            <Button size="sm" disabled={busy} onClick={() => handleSavePrizeDistribution(board)}>
                              Save
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => setEditingPrizeId(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingPrizeId(board.id);
                            setPrizeDraft(board.prizeDistribution ?? []);
                          }}
                          className="font-heading mt-1.5 flex items-center gap-1 text-xs text-ash-400 hover:text-white"
                        >
                          <Pencil size={11} />
                          {board.prizeDistribution?.length
                            ? board.prizeDistribution
                                .map((t) => `${ordinal(t.rank)} ${formatCurrency(t.amount, board.currency)}`)
                                .join(" · ")
                            : "Set prize distribution"}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {board.isLive ? (
                        <button
                          disabled={busy}
                          onClick={() => runAction(() => unsetWagerLeaderboardLive(board.id))}
                          className="font-heading flex items-center gap-1.5 rounded-full border border-crimson-400/40 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-crimson-300 hover:bg-crimson-500/10 disabled:opacity-50"
                        >
                          <RadioTower size={13} /> Take Down
                        </button>
                      ) : (
                        <button
                          disabled={busy}
                          onClick={() => runAction(() => setWagerLeaderboardLive(board.id))}
                          className="font-heading flex items-center gap-1.5 rounded-full border border-lava-400/40 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-lava-300 hover:bg-lava-500/10 disabled:opacity-50"
                        >
                          <Radio size={13} /> Go Live
                        </button>
                      )}
                      <button
                        disabled={busy}
                        onClick={() => {
                          if (confirm("End this race and archive it into Past Winners? This locks in the current ranking as the final result."))
                            runAction(() => archiveWagerLeaderboard(board.id));
                        }}
                        className="font-heading flex items-center gap-1.5 rounded-full border border-gold-400/40 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-gold-300 hover:bg-gold-500/10 disabled:opacity-50"
                      >
                        <FlagOff size={13} /> End & Archive
                      </button>
                      <button
                        onClick={() => setExpanded(expanded === board.id ? null : board.id)}
                        className="font-heading rounded-full border border-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-ash-300 hover:text-white"
                      >
                        {expanded === board.id ? "Hide" : "Manage"} Entries
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Delete this leaderboard permanently?")) runAction(() => deleteWagerLeaderboard(board.id));
                        }}
                        aria-label="Delete leaderboard"
                        className="rounded-full p-2 text-ash-500 hover:bg-crimson-500/10 hover:text-crimson-300"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {expanded === board.id && <EntryManager board={board} runAction={runAction} busy={busy} />}
                </GlassCard>
              ))}
            </div>
          )}
        </>
      ) : (
        <PastWinners boards={archived} loading={loading} />
      )}
    </div>
  );
}

function PastWinners({ boards, loading }: { boards: WagerLeaderboard[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 size={24} className="animate-spin text-lava-400" />
      </div>
    );
  }
  if (boards.length === 0) {
    return <GlassCard className="py-14 text-center text-sm text-ash-400">No archived leaderboards yet.</GlassCard>;
  }
  return (
    <div className="space-y-4">
      {boards.map((board) => (
        <GlassCard key={board.id}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-heading text-sm font-bold text-white">{board.displayTitle}</h3>
            <span className="text-xs text-ash-500">
              Archived {board.archivedAt ? new Date(board.archivedAt).toLocaleString() : ""}
            </span>
          </div>
          {board.winners.length === 0 ? (
            <p className="mt-3 text-xs text-ash-500">No entries were recorded when this race ended.</p>
          ) : (
            <div className="mt-3 space-y-1.5">
              {board.winners.map((w) => (
                <div key={w.rank} className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.03] px-3 py-2">
                  <span className="text-sm text-white">
                    <span className="mr-2 font-heading text-xs text-gold-400">{ordinal(w.rank)}</span>
                    {w.name}
                    <span className="ml-2 text-xs text-ash-500">{formatCurrency(w.wagered, board.currency)} wagered</span>
                  </span>
                  <span className="font-heading text-xs font-bold text-gold-300">
                    {formatCurrency(w.prizeAmount, board.currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      ))}
    </div>
  );
}

function EntryManager({
  board,
  runAction,
  busy,
}: {
  board: WagerLeaderboard;
  runAction: (action: () => Promise<unknown>) => Promise<void>;
  busy: boolean;
}) {
  const [name, setName] = useState("");
  const [wagered, setWagered] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editWagered, setEditWagered] = useState("");

  const handleAdd = async () => {
    const amount = Number(wagered);
    if (!name.trim() || !Number.isFinite(amount) || amount < 0) return alert("Enter a name and a valid wagered amount");
    await runAction(() => addWagerEntry(board.id, { name: name.trim(), wagered: amount }));
    setName("");
    setWagered("");
  };

  const handleSaveEdit = async (entry: WagerEntry) => {
    const amount = Number(editWagered);
    if (!Number.isFinite(amount) || amount < 0) return alert("Enter a valid wagered amount");
    await runAction(() => editWagerEntry(board.id, entry.id, { wagered: amount }));
    setEditingId(null);
  };

  return (
    <div className="mt-4 border-t border-white/5 pt-4">
      <div className="flex flex-wrap gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Player name" className="ggb-input flex-1" />
        <input
          value={wagered}
          onChange={(e) => setWagered(e.target.value)}
          placeholder={`Wagered (${board.currency})`}
          inputMode="decimal"
          className="ggb-input w-40"
        />
        <Button size="sm" disabled={busy || !name.trim() || !wagered} onClick={handleAdd}>
          <Plus size={14} /> Add
        </Button>
      </div>

      {board.entries.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {board.entries.map((entry, i) => (
            <div key={entry.id} className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.03] px-3 py-2">
              <span className="text-sm text-white">
                <span className="mr-2 text-ash-500">#{i + 1}</span>
                {entry.name}
              </span>
              {editingId === entry.id ? (
                <div className="flex items-center gap-1.5">
                  <input
                    autoFocus
                    value={editWagered}
                    onChange={(e) => setEditWagered(e.target.value)}
                    className="ggb-input w-28 py-1 text-xs"
                  />
                  <Button size="sm" disabled={busy} onClick={() => handleSaveEdit(entry)}>
                    Save
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-lava-300">
                    {formatCurrency(entry.wagered, board.currency)}
                  </span>
                  <button
                    onClick={() => {
                      setEditingId(entry.id);
                      setEditWagered(String(entry.wagered));
                    }}
                    aria-label="Edit wagered amount"
                    className="rounded-full p-1.5 text-ash-500 hover:bg-white/5 hover:text-white"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => runAction(() => removeWagerEntry(board.id, entry.id))}
                    aria-label="Remove entry"
                    className="rounded-full p-1.5 text-ash-500 hover:bg-crimson-500/10 hover:text-crimson-300"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
