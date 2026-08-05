"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, Trash2, Pencil, Users, Dices, UserCheck, CheckCircle2, XCircle, Flag, RotateCcw, Ban, Plus } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { BingoGrid } from "@/components/bingo/BingoGrid";
import { participantName, lineLabel, lineWinnerNames } from "@/lib/bingoUtils";
import {
  fetchBingoGames,
  createBingoGame,
  setBingoKeyword,
  openBingoRegistration,
  startBingoGame,
  spinBingoCell,
  drawBingoPlayer,
  setBingoCellSlot,
  markBingoResult,
  completeBingoGame,
  unliveBingoGame,
  cancelBingoGame,
  deleteBingoGame,
  addBingoParticipant,
  removeBingoParticipant,
  StreamGameApiError,
} from "@/lib/streamGamesApi";
import type { BingoGame, BingoStatus } from "@/lib/api";

const SLUG = "bonus-bingo";
const POLL_MS = 3000;

const statusTone: Record<BingoStatus, "live" | "gold" | "neutral" | "lava"> = {
  DRAFT: "neutral",
  REGISTRATION: "lava",
  ACTIVE: "live",
  COMPLETED: "gold",
  CANCELLED: "neutral",
};

export default function BonusBingoControlPanel() {
  const [games, setGames] = useState<BingoGame[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [includeWinners, setIncludeWinners] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [keyword, setKeyword] = useState("!join");
  const [gridSize, setGridSize] = useState<3 | 4 | 5>(5);
  const [linePoints, setLinePoints] = useState(500);

  const [keywordDraft, setKeywordDraft] = useState("");
  const [editingKeyword, setEditingKeyword] = useState(false);
  const [participantInput, setParticipantInput] = useState("");

  const load = useCallback(async () => {
    try {
      const list = await fetchBingoGames(SLUG);
      setGames(list);
      setSelectedId((prev) => prev ?? list[0]?.id ?? null);
    } catch {
      // stay on last known state — the poll will retry
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
  }, [load]);

  const selected = games.find((g) => g.id === selectedId) ?? null;
  const active = games.find((g) => g.status === "DRAFT" || g.status === "REGISTRATION" || g.status === "ACTIVE") ?? null;
  const history = games.filter((g) => g.status === "COMPLETED" || g.status === "CANCELLED");

  const runAction = async (action: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await action();
      await load();
    } catch (err) {
      alert(err instanceof StreamGameApiError ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) return alert("Enter a title");
    setBusy(true);
    try {
      const game = await createBingoGame(SLUG, { title: title.trim(), gridSize, linePoints, keyword: keyword.trim() || "!join" });
      setShowCreate(false);
      setTitle("");
      setKeyword("!join");
      setGridSize(5);
      setLinePoints(500);
      setSelectedId(game.id);
      await load();
    } catch (err) {
      alert(err instanceof StreamGameApiError ? err.message : "Failed to create");
    } finally {
      setBusy(false);
    }
  };

  const handleAddParticipant = async () => {
    if (!selected || !participantInput.trim()) return;
    await runAction(() => addBingoParticipant(selected.id, participantInput.trim()));
    setParticipantInput("");
  };

  const activeCell = selected?.cells.find((c) => c.id === selected.currentCellId) ?? null;

  return (
    <div className="space-y-6">
      <Link href="/admin/stream-games" className="flex w-fit items-center gap-1.5 text-xs font-semibold text-ash-400 hover:text-white">
        <ArrowLeft size={13} /> Stream Games
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <p className="font-heading text-xs font-bold uppercase tracking-[0.3em] text-lava-500">Live Control</p>
          <h2 className="text-ember text-2xl sm:text-3xl">Bonus Bingo</h2>
        </div>
        {!active && (
          <Button size="sm" onClick={() => setShowCreate((v) => !v)}>
            <Plus size={15} /> New Game
          </Button>
        )}
      </div>

      {showCreate && !active && (
        <GlassCard>
          <h3 className="font-heading text-sm font-semibold uppercase tracking-widest text-ash-100">New Bingo Game</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-300">Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Bonus Bingo — August" className="ggb-input mt-1" />
            </div>
            <div>
              <label className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-300">Entry Keyword</label>
              <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="!join" className="ggb-input mt-1" />
              <p className="mt-1 text-[11px] text-ash-500">Typed in chat, optionally followed by a slot name.</p>
            </div>
            <div>
              <label className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-300">Grid Size</label>
              <div className="mt-1 flex gap-1.5">
                {[3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setGridSize(n as 3 | 4 | 5)}
                    className={`font-heading rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                      gridSize === n ? "border-lava-400/50 bg-lava-500/15 text-lava-300" : "border-white/10 text-ash-400 hover:text-white"
                    }`}
                  >
                    {n}×{n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-300">Line Win Points</label>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {[250, 500, 1000, 2500].map((n) => (
                  <button
                    key={n}
                    onClick={() => setLinePoints(n)}
                    className={`font-heading rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                      linePoints === n ? "border-lava-400/50 bg-lava-500/15 text-lava-300" : "border-white/10 text-ash-400 hover:text-white"
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <input
                  value={linePoints}
                  onChange={(e) => setLinePoints(Number(e.target.value) || 0)}
                  inputMode="numeric"
                  className="ggb-input w-24 py-1.5 text-xs"
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button size="sm" disabled={busy || !title.trim()} onClick={handleCreate}>
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
      ) : selected ? (
        <>
          <GlassCard>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Badge tone={statusTone[selected.status]} pulse={selected.status === "ACTIVE"}>
                    {selected.status}
                  </Badge>
                  <h3 className="font-heading text-sm font-bold text-white">{selected.title}</h3>
                </div>
                <p className="mt-1.5 text-xs text-ash-400">
                  {selected.gridSize}×{selected.gridSize} · {selected.linePoints} pts/line · {selected.participants.length} joined
                </p>
                {editingKeyword ? (
                  <div className="mt-2 flex items-center gap-1.5">
                    <input
                      autoFocus
                      value={keywordDraft}
                      onChange={(e) => setKeywordDraft(e.target.value)}
                      className="ggb-input w-40 py-1 text-xs"
                    />
                    <Button
                      size="sm"
                      disabled={busy || !keywordDraft.trim()}
                      onClick={async () => {
                        await runAction(() => setBingoKeyword(selected.id, keywordDraft.trim()));
                        setEditingKeyword(false);
                      }}
                    >
                      Save
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setEditingKeyword(false)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingKeyword(true);
                      setKeywordDraft(selected.keyword);
                    }}
                    className="font-heading mt-2 flex items-center gap-1 text-xs text-ash-400 hover:text-white"
                  >
                    <Pencil size={11} /> Keyword: {selected.keyword}
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {selected.status === "DRAFT" && (
                  <Button size="sm" disabled={busy} onClick={() => runAction(() => openBingoRegistration(selected.id))}>
                    Open Registration
                  </Button>
                )}
                {selected.status === "REGISTRATION" && (
                  <Button size="sm" disabled={busy || selected.participants.length === 0} onClick={() => runAction(() => startBingoGame(selected.id))}>
                    Start Game
                  </Button>
                )}
                {selected.status === "ACTIVE" && (
                  <button
                    disabled={busy}
                    onClick={() => runAction(() => unliveBingoGame(selected.id))}
                    className="font-heading flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-ash-300 hover:text-white disabled:opacity-50"
                  >
                    <RotateCcw size={13} /> Unlive
                  </button>
                )}
                {selected.status !== "COMPLETED" && selected.status !== "CANCELLED" && (
                  <>
                    <button
                      disabled={busy}
                      onClick={() => {
                        if (confirm("End this bingo game now?")) runAction(() => completeBingoGame(selected.id));
                      }}
                      className="font-heading flex items-center gap-1.5 rounded-full border border-gold-400/40 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-gold-300 hover:bg-gold-500/10 disabled:opacity-50"
                    >
                      <Flag size={13} /> End Game
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => {
                        if (confirm("Cancel this bingo game? This can't be undone.")) runAction(() => cancelBingoGame(selected.id));
                      }}
                      className="font-heading flex items-center gap-1.5 rounded-full border border-crimson-400/40 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-crimson-300 hover:bg-crimson-500/10 disabled:opacity-50"
                    >
                      <Ban size={13} /> Cancel
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    if (confirm("Delete this bingo game permanently?"))
                      runAction(async () => {
                        await deleteBingoGame(selected.id);
                        setSelectedId(null);
                      });
                  }}
                  aria-label="Delete game"
                  className="rounded-full p-2 text-ash-500 hover:bg-crimson-500/10 hover:text-crimson-300"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </GlassCard>

          {selected.status !== "COMPLETED" && selected.status !== "CANCELLED" && (
            <GlassCard>
              <h3 className="font-heading flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-ash-100">
                <Users size={13} /> Participants ({selected.participants.length})
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  value={participantInput}
                  onChange={(e) => setParticipantInput(e.target.value)}
                  placeholder="Add chat username manually"
                  className="ggb-input flex-1"
                />
                <Button size="sm" disabled={busy || !participantInput.trim()} onClick={handleAddParticipant}>
                  <Plus size={14} /> Add
                </Button>
              </div>
              {selected.participants.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {selected.participants.map((p) => (
                    <span
                      key={p.id}
                      className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-ash-100"
                    >
                      {p.userId && <UserCheck size={11} className="text-lava-400" />}
                      {participantName(p)}
                      {p.preferredSlot && <span className="text-[10px] text-ash-500">🎰 {p.preferredSlot}</span>}
                      <button
                        onClick={() => runAction(() => removeBingoParticipant(selected.id, p.chatUsername))}
                        aria-label="Remove participant"
                        className="text-ash-500 hover:text-crimson-300"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </GlassCard>
          )}

          {selected.status === "ACTIVE" && (
            <div className="grid gap-4 sm:grid-cols-3">
              <GlassCard>
                <p className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-300">1. Spin</p>
                <p className="mt-2 text-sm text-white">
                  {activeCell ? `Cell R${activeCell.row + 1} · C${activeCell.col + 1} selected` : "Spin the wheel"}
                </p>
                <Button size="sm" className="mt-3" disabled={busy || !!selected.currentCellId} onClick={() => runAction(() => spinBingoCell(selected.id))}>
                  <Dices size={14} /> Spin
                </Button>
              </GlassCard>

              <GlassCard>
                <p className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-300">2. Draw Player</p>
                <p className="mt-2 text-sm text-white">{selected.currentChatUsername ?? "Draw a viewer"}</p>
                <label className="mt-2 flex items-center gap-1.5 text-[11px] text-ash-400">
                  <input type="checkbox" checked={includeWinners} onChange={(e) => setIncludeWinners(e.target.checked)} className="h-3.5 w-3.5 accent-lava-400" />
                  Include past winners
                </label>
                <Button
                  size="sm"
                  className="mt-2"
                  disabled={busy || !selected.currentCellId || !!selected.currentChatUsername}
                  onClick={() => runAction(() => drawBingoPlayer(selected.id, includeWinners))}
                >
                  <Users size={14} /> Draw
                </Button>
              </GlassCard>

              <GlassCard>
                <p className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-300">3. Result</p>
                <p className="mt-2 text-sm text-white">{activeCell?.slotName ? activeCell.slotName : "Mark result"}</p>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    disabled={busy || !selected.currentCellId}
                    onClick={() => {
                      if (confirm("Mark this bonus as a WIN? The cell will turn green.")) runAction(() => markBingoResult(selected.id, true));
                    }}
                  >
                    <CheckCircle2 size={14} /> Won
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busy || !selected.currentCellId}
                    onClick={() => {
                      if (confirm("Mark this bonus as a LOSS? The cell resets and can be re-spun.")) runAction(() => markBingoResult(selected.id, false));
                    }}
                  >
                    <XCircle size={14} /> Lost
                  </Button>
                </div>
              </GlassCard>
            </div>
          )}

          {(selected.status === "ACTIVE" || selected.status === "COMPLETED") && (
            <GlassCard className="p-4">
              <BingoGrid
                game={selected}
                onActiveCellClick={
                  activeCell && !activeCell.slotName
                    ? () => {
                        const slotName = prompt("Set the slot/bonus name for this cell:");
                        if (slotName?.trim()) runAction(() => setBingoCellSlot(selected.id, activeCell.id, slotName.trim()));
                      }
                    : undefined
                }
              />
            </GlassCard>
          )}

          {selected.lineWins.length > 0 && (
            <GlassCard>
              <h3 className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-100">Completed Lines</h3>
              <div className="mt-2 space-y-1.5">
                {selected.lineWins.map((w) => (
                  <div key={w.id} className="flex items-center justify-between text-xs text-ash-300">
                    <span>
                      {lineLabel(w.lineType, w.lineIndex)} — {lineWinnerNames(selected.cells, w, selected.gridSize).join(", ") || "no linked winners"}
                    </span>
                    <span className="text-gold-300">{w.pointsEach} pts each</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </>
      ) : (
        <GlassCard className="py-14 text-center text-sm text-ash-400">No bingo game set up yet — create one to get started.</GlassCard>
      )}

      {history.length > 0 && (
        <div>
          <h3 className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-500">Past Games</h3>
          <div className="mt-2 space-y-1.5">
            {history.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedId(g.id)}
                className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs ${
                  selectedId === g.id ? "border-lava-400/40 bg-lava-500/5" : "border-white/5 text-ash-400 hover:text-white"
                }`}
              >
                <span>{g.title}</span>
                <span className="flex items-center gap-2">
                  <Badge tone={statusTone[g.status]}>{g.status}</Badge>
                  <span className="text-gold-300">{g.lineWins.length} lines</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
