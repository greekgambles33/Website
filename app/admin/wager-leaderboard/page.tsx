"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Radio, RadioTower, Pencil } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import {
  fetchWagerLeaderboards,
  createWagerLeaderboard,
  deleteWagerLeaderboard,
  addWagerEntry,
  editWagerEntry,
  removeWagerEntry,
  setWagerLeaderboardLive,
  unsetWagerLeaderboardLive,
  WagerLeaderboardApiError,
} from "@/lib/wagerLeaderboardApi";
import type { WagerLeaderboard, WagerEntry } from "@/lib/api";

export default function AdminWagerLeaderboardPage() {
  const [boards, setBoards] = useState<WagerLeaderboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [prizeAmount, setPrizeAmount] = useState("");
  const [currency, setCurrency] = useState("USD");

  const load = useCallback(async () => {
    try {
      setBoards(await fetchWagerLeaderboards());
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
      await createWagerLeaderboard({ title: title || null, prizeAmount: amount, currency });
      setShowCreate(false);
      setTitle("");
      setPrizeAmount("");
      setCurrency("USD");
      await load();
    } catch (err) {
      alert(err instanceof WagerLeaderboardApiError ? err.message : "Failed to create");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
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
