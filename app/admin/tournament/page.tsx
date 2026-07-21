"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  Plus,
  Trash2,
  Play,
  Shuffle,
  RadioTower,
  Copy,
  ExternalLink,
  Ban,
  Users,
  Dices,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { TournamentBracket } from "@/components/tournament/TournamentBracket";
import {
  fetchTournaments,
  fetchTournament,
  createTournament,
  deleteTournament,
  cancelTournament,
  openRegistration,
  fetchEntries,
  drawWinners,
  rerollParticipant,
  startTournament,
  declareMatchWinner,
  revertMatchWinner,
  TournamentApiError,
} from "@/lib/tournamentsApi";
import type { FullTournament, Tournament, TournamentEntry } from "@/lib/api";

const statusTone = {
  DRAFT: "neutral",
  REGISTRATION: "lava",
  SLOT_SELECTION: "live",
  IN_PROGRESS: "live",
  COMPLETED: "gold",
  CANCELLED: "neutral",
} as const;

export default function AdminTournamentPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<FullTournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showDraw, setShowDraw] = useState(false);

  const loadList = useCallback(async () => {
    try {
      const data = await fetchTournaments();
      setTournaments(data);
      if (!selectedId && data.length > 0) setSelectedId(data[0].id);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSelected = useCallback(async (id: string) => {
    try {
      setSelected(await fetchTournament(id));
    } catch {
      setSelected(null);
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    if (selectedId) loadSelected(selectedId);
    else setSelected(null);
  }, [selectedId, loadSelected]);

  const refresh = () => {
    loadList();
    if (selectedId) loadSelected(selectedId);
  };

  const runAction = async (action: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await action();
      refresh();
    } catch (err) {
      alert(err instanceof TournamentApiError ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this tournament permanently? This cannot be undone.")) return;
    try {
      await deleteTournament(id);
      if (selectedId === id) setSelectedId(null);
      loadList();
    } catch (err) {
      alert(err instanceof TournamentApiError ? err.message : "Failed to delete");
    }
  };

  const copyWidgetUrl = () => {
    navigator.clipboard.writeText(`${window.location.origin}/tournament-widget`);
    alert("OBS widget URL copied to clipboard");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div className="space-y-4">
        <button
          onClick={() => setShowCreate(true)}
          className="font-heading flex w-full items-center justify-center gap-2 rounded-[10px] bg-gradient-to-b from-lava-300 to-lava-400 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[#140a04]"
        >
          <Plus size={15} /> New Tournament
        </button>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={20} className="animate-spin text-lava-400" />
          </div>
        ) : tournaments.length === 0 ? (
          <p className="py-8 text-center text-xs text-ash-500">No tournaments yet.</p>
        ) : (
          <div className="space-y-1.5">
            {tournaments.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={`w-full rounded-xl border p-3 text-left transition-colors ${
                  selectedId === t.id
                    ? "border-lava-400/50 bg-lava-500/10"
                    : "border-white/5 hover:border-white/10"
                }`}
              >
                <p className="truncate text-sm font-medium text-white">{t.title}</p>
                <div className="mt-1.5 flex items-center justify-between">
                  <Badge tone={statusTone[t.status]} pulse={t.status === "IN_PROGRESS"}>
                    {t.status}
                  </Badge>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(t.id);
                    }}
                    aria-label="Delete tournament"
                    className="rounded-full p-1 text-ash-500 hover:bg-crimson-500/10 hover:text-crimson-300"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="min-w-0">
        {!selected ? (
          <GlassCard className="py-14 text-center text-sm text-ash-400">
            {tournaments.length === 0 ? "Create a tournament to get started." : "Select a tournament."}
          </GlassCard>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-white">{selected.title}</h2>
                  <Badge tone={statusTone[selected.status]} pulse={selected.status === "IN_PROGRESS"}>
                    {selected.status}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-ash-500">
                  {selected.maxPlayers} players &middot; {selected.slotTimerSeconds}s slot timer
                  {selected.prizeCoins > 0 && ` · ${selected.prizeCoins.toLocaleString()} coin prize`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={copyWidgetUrl}
                  className="font-heading flex items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-2 text-xs font-semibold uppercase tracking-wide text-ash-300 hover:text-white"
                >
                  <Copy size={13} /> OBS Widget
                </button>
                <Link
                  href={`/tournament/${selected.id}`}
                  target="_blank"
                  className="font-heading flex items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-2 text-xs font-semibold uppercase tracking-wide text-ash-300 hover:text-white"
                >
                  <ExternalLink size={13} /> Public Page
                </Link>

                {selected.status === "DRAFT" && (
                  <button
                    disabled={busy}
                    onClick={() => runAction(() => openRegistration(selected.id))}
                    className="font-heading flex items-center gap-1.5 rounded-[10px] bg-gradient-to-b from-lava-300 to-lava-400 px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#140a04] disabled:opacity-50"
                  >
                    <Users size={13} /> Open Registration
                  </button>
                )}
                {selected.status === "REGISTRATION" && (
                  <button
                    disabled={busy}
                    onClick={() => setShowDraw(true)}
                    className="font-heading flex items-center gap-1.5 rounded-[10px] bg-gradient-to-b from-lava-300 to-lava-400 px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#140a04] disabled:opacity-50"
                  >
                    <Dices size={13} /> Draw Players
                  </button>
                )}
                {selected.status === "SLOT_SELECTION" && (
                  <button
                    disabled={busy}
                    onClick={() => {
                      if (confirm("Force start the bracket now? Any player who hasn't confirmed a slot will be left out."))
                        runAction(() => startTournament(selected.id));
                    }}
                    className="font-heading flex items-center gap-1.5 rounded-[10px] bg-gradient-to-b from-lava-300 to-lava-400 px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#140a04] disabled:opacity-50"
                  >
                    <Play size={13} /> Force Start
                  </button>
                )}
                {!["COMPLETED", "CANCELLED"].includes(selected.status) && (
                  <button
                    disabled={busy}
                    onClick={() => {
                      if (confirm("Cancel this tournament?")) runAction(() => cancelTournament(selected.id));
                    }}
                    className="font-heading flex items-center gap-1.5 rounded-[10px] border border-crimson-400/40 px-4 py-2 text-xs font-bold uppercase tracking-wide text-crimson-300 disabled:opacity-50"
                  >
                    <Ban size={13} /> Cancel
                  </button>
                )}
              </div>
            </div>

            {selected.status === "SLOT_SELECTION" && (
              <GlassCard className="p-0">
                <p className="font-heading border-b border-white/5 px-5 py-3 text-xs font-semibold uppercase tracking-widest text-ash-300">
                  Drawn Players ({selected.participants.filter((p) => p.slotConfirmed).length}/
                  {selected.participants.length} confirmed)
                </p>
                <div className="divide-y divide-white/5">
                  {selected.participants.map((p) => (
                    <div key={p.id} className="flex items-center justify-between px-5 py-3 text-sm">
                      <span className="text-white">{p.user.displayName}</span>
                      <div className="flex items-center gap-3">
                        {p.slotConfirmed ? (
                          <span className="text-xs text-lava-300">{p.slotCall}</span>
                        ) : (
                          <>
                            <span className="text-xs text-ash-500">Choosing…</span>
                            <button
                              disabled={busy}
                              onClick={() => runAction(() => rerollParticipant(selected.id, p.id))}
                              className="font-heading flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-ash-400 hover:text-white"
                            >
                              <Shuffle size={11} /> Reroll
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {(selected.status === "IN_PROGRESS" || selected.status === "COMPLETED") && (
              <GlassCard>
                <TournamentBracket
                  tournament={selected}
                  isAdmin
                  onDeclareWinner={(matchId, winnerId) =>
                    runAction(() => declareMatchWinner(matchId, winnerId))
                  }
                  onRevertWinner={(matchId) => runAction(() => revertMatchWinner(matchId))}
                />
              </GlassCard>
            )}

            {selected.status === "REGISTRATION" && (
              <GlassCard className="text-center">
                <p className="font-display text-3xl text-white">{selected.entries.length}</p>
                <p className="font-heading mt-1 text-xs font-semibold uppercase tracking-widest text-ash-300">
                  Entries So Far
                </p>
              </GlassCard>
            )}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={(t) => {
            setShowCreate(false);
            setSelectedId(t.id);
            loadList();
          }}
        />
      )}

      {showDraw && selected && (
        <DrawModal
          tournament={selected}
          onClose={() => setShowDraw(false)}
          onDrawn={() => {
            setShowDraw(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: (t: Tournament) => void }) {
  const [title, setTitle] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [slotMinutes, setSlotMinutes] = useState(3);
  const [prizeCoins, setPrizeCoins] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setError("Title is required");

    setSubmitting(true);
    setError(null);
    try {
      const t = await createTournament({
        title: title.trim(),
        maxPlayers,
        slotTimerSeconds: Math.round(slotMinutes * 60),
        prizeCoins: prizeCoins ? Number(prizeCoins) : 0,
      });
      onCreated(t);
    } catch (err) {
      setError(err instanceof TournamentApiError ? err.message : "Failed to create tournament");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <GlassCard className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-white">New Tournament</h2>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-300">Title</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="HellCat Slot Knockout"
              className="ggb-input mt-1.5"
            />
          </div>
          <div>
            <label className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-300">
              Max Players
            </label>
            <div className="mt-1.5 flex gap-2">
              {[4, 8, 16, 32].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setMaxPlayers(n)}
                  className={`flex-1 rounded-lg border py-2 text-sm font-semibold ${
                    maxPlayers === n ? "border-lava-400/60 bg-lava-500/15 text-white" : "border-white/10 text-ash-400"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-300">
              Slot Timer (minutes)
            </label>
            <div className="mt-1.5 flex gap-2">
              {[2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSlotMinutes(n)}
                  className={`flex-1 rounded-lg border py-2 text-sm font-semibold ${
                    slotMinutes === n ? "border-lava-400/60 bg-lava-500/15 text-white" : "border-white/10 text-ash-400"
                  }`}
                >
                  {n}m
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-300">
              Champion Prize (HellCatCoins, optional)
            </label>
            <input
              value={prizeCoins}
              onChange={(e) => setPrizeCoins(e.target.value)}
              placeholder="0"
              inputMode="numeric"
              className="ggb-input mt-1.5"
            />
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

function DrawModal({
  tournament,
  onClose,
  onDrawn,
}: {
  tournament: FullTournament;
  onClose: () => void;
  onDrawn: () => void;
}) {
  const [entries, setEntries] = useState<TournamentEntry[]>(tournament.entries);
  const [count, setCount] = useState(Math.min(tournament.maxPlayers, tournament.entries.length || tournament.maxPlayers));
  const [guaranteed, setGuaranteed] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchEntries(tournament.id).then(setEntries).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [tournament.id]);

  const toggleGuaranteed = (userId: string) => {
    setGuaranteed((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await drawWinners(tournament.id, count, Array.from(guaranteed));
      onDrawn();
    } catch (err) {
      setError(err instanceof TournamentApiError ? err.message : "Failed to draw players");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <GlassCard className="flex max-h-[85vh] w-full max-w-md flex-col" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-white">Draw Players</h2>
        <p className="mt-1 text-xs text-ash-400">{entries.length} entered</p>

        <div className="mt-4 flex items-center gap-3">
          <label className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-300">
            Draw Size
          </label>
          <input
            value={count}
            onChange={(e) => setCount(Math.max(2, Math.min(64, Number(e.target.value) || 2)))}
            type="number"
            min={2}
            max={64}
            className="ggb-input w-20"
          />
        </div>

        <p className="mt-3 text-xs text-ash-500">
          ✓ {guaranteed.size} guaranteed &middot; 🎲 {Math.max(0, count - guaranteed.size)} random
        </p>

        <div className="mt-3 flex-1 space-y-1 overflow-y-auto">
          {entries.map((entry) => (
            <label
              key={entry.id}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-white/[0.03]"
            >
              <input
                type="checkbox"
                checked={guaranteed.has(entry.userId)}
                onChange={() => toggleGuaranteed(entry.userId)}
                className="accent-lava-400"
              />
              <span className="text-white">{entry.user.displayName}</span>
            </label>
          ))}
        </div>

        {error && <p className="mt-2 text-xs text-crimson-400">{error}</p>}

        <div className="mt-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-[10px] border border-white/10 py-2.5 text-xs font-semibold uppercase tracking-wide text-ash-300 hover:text-white"
          >
            Cancel
          </button>
          <button
            disabled={submitting || entries.length === 0}
            onClick={handleSubmit}
            className="font-heading flex-1 rounded-[10px] bg-gradient-to-b from-lava-300 to-lava-400 py-2.5 text-xs font-bold uppercase tracking-wide text-[#140a04] disabled:opacity-50"
          >
            {submitting ? "Drawing…" : "Draw"}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
