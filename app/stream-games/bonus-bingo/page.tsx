"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { BingoGrid } from "@/components/bingo/BingoGrid";
import { participantName, lineLabel, lineWinnerNames } from "@/lib/bingoUtils";
import { fetchActiveBingoGame, fetchBingoGames, fetchStreamGameBySlug } from "@/lib/streamGamesApi";
import type { BingoGame, BingoStatus, StreamGame } from "@/lib/api";

const SLUG = "bonus-bingo";
const POLL_MS = 3000;

const statusTone: Record<BingoStatus, "live" | "gold" | "neutral" | "lava"> = {
  DRAFT: "neutral",
  REGISTRATION: "lava",
  ACTIVE: "live",
  COMPLETED: "gold",
  CANCELLED: "neutral",
};

export default function BonusBingoPublicPage() {
  const [game, setGame] = useState<StreamGame | null>(null);
  const [active, setActive] = useState<BingoGame | null | undefined>(undefined);
  const [past, setPast] = useState<BingoGame[]>([]);

  useEffect(() => {
    fetchStreamGameBySlug(SLUG)
      .then(setGame)
      .catch(() => setGame(null));
  }, []);

  useEffect(() => {
    const load = () => {
      fetchActiveBingoGame(SLUG)
        .then(setActive)
        .catch(() => setActive(null));
      fetchBingoGames(SLUG)
        .then((games) => setPast(games.filter((g) => g.status === "COMPLETED" || g.status === "CANCELLED").slice(0, 6)))
        .catch(() => {});
    };
    load();
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <Section>
      <SectionHeading
        eyebrow="Free to Play · Complete a Line to Win"
        title="Bonus Bingo"
        description="A wheel spins to select a square, a viewer is drawn, and if their bonus buy profits the square turns green. First completed line wins."
      />

      {game?.prizeModeEnabled && game.prizeRulesText && (
        <div className="mx-auto mt-8 max-w-2xl rounded-xl border border-gold-500/30 bg-gold-500/5 px-5 py-3 text-center text-xs text-gold-200">
          {game.prizeRulesText}
        </div>
      )}

      {active === undefined ? (
        <div className="mt-16 flex justify-center">
          <Loader2 size={24} className="animate-spin text-lava-400" />
        </div>
      ) : !active || active.status === "DRAFT" ? (
        <GlassCard className="mx-auto mt-12 max-w-xl text-center">
          <p className="text-sm text-ash-300">No bingo game is running right now — check back when the stream&apos;s live.</p>
        </GlassCard>
      ) : (
        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <GlassCard glow>
              <div className="flex items-center justify-between gap-3">
                <Badge tone={statusTone[active.status]} pulse={active.status === "ACTIVE"}>
                  {active.status}
                </Badge>
                <span className="text-xs text-ash-400">
                  {active.gridSize}×{active.gridSize} · {active.linePoints} pts/line
                </span>
              </div>
              <h3 className="mt-3 text-xl font-bold text-white">{active.title}</h3>

              {active.status === "REGISTRATION" && (
                <p className="mt-2 text-sm text-ash-300">
                  Type <code className="rounded bg-ash-800 px-1.5 py-0.5 text-lava-300">{active.keyword}</code> in Twitch or Kick chat
                  to join — optionally followed by your default slot, e.g.{" "}
                  <code className="rounded bg-ash-800 px-1.5 py-0.5 text-lava-300">{active.keyword} sweet bonanza</code>.
                </p>
              )}

              {active.status === "ACTIVE" && active.currentChatUsername && (
                <div className="mt-3 rounded-xl border border-gold-500/30 bg-gold-500/5 px-4 py-3">
                  <p className="text-sm text-white">
                    <strong>{active.currentChatUsername}</strong> is up!
                  </p>
                  {active.cells.find((c) => c.id === active.currentCellId)?.slotName ? (
                    <p className="mt-1 text-xs text-ash-300">
                      Slot: {active.cells.find((c) => c.id === active.currentCellId)?.slotName}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-ash-400">
                      Waiting for their slot pick —{" "}
                      <code className="rounded bg-ash-800 px-1.5 py-0.5 text-lava-300">!slot &lt;name&gt;</code> in chat.
                    </p>
                  )}
                </div>
              )}

              {active.status === "ACTIVE" && !active.currentCellId && (
                <p className="mt-3 text-sm text-ash-400">Waiting for the wheel to spin…</p>
              )}

              {(active.status === "ACTIVE" || active.status === "COMPLETED") && (
                <div className="mt-5">
                  <BingoGrid game={active} />
                </div>
              )}
            </GlassCard>

            {active.lineWins.length > 0 && (
              <GlassCard>
                <h3 className="font-heading text-sm font-semibold uppercase tracking-widest text-ash-100">Completed Lines</h3>
                <ol className="mt-3 space-y-2">
                  {active.lineWins.map((w) => (
                    <li key={w.id} className="flex items-center justify-between text-sm">
                      <span className="text-ash-100">
                        {lineLabel(w.lineType, w.lineIndex)} — {lineWinnerNames(active.cells, w, active.gridSize).join(", ") || "unlinked winner"}
                      </span>
                      <span className="text-xs text-gold-300">{w.pointsEach} pts each</span>
                    </li>
                  ))}
                </ol>
              </GlassCard>
            )}

            {active.status === "COMPLETED" && (
              <GlassCard className="text-center">
                <p className="text-sm text-gold-300">Bingo complete — every square claimed! 🏆</p>
              </GlassCard>
            )}
          </div>

          <div className="space-y-6">
            {active.status === "REGISTRATION" && active.participants.length > 0 && (
              <GlassCard>
                <h3 className="font-heading text-sm font-semibold uppercase tracking-widest text-ash-100">
                  Joined ({active.participants.length})
                </h3>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {active.participants.map((p) => (
                    <span key={p.id} className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-ash-100">
                      {participantName(p)}
                    </span>
                  ))}
                </div>
              </GlassCard>
            )}

            <GlassCard>
              <h3 className="font-heading text-sm font-semibold uppercase tracking-widest text-ash-100">Chat Commands</h3>
              <ul className="mt-3 space-y-2 text-xs text-ash-300">
                <li>
                  <code className="rounded bg-ash-800 px-1.5 py-0.5 text-lava-300">{active.keyword} &lt;slot&gt;</code> — join (or update
                  your default slot)
                </li>
                <li>
                  <code className="rounded bg-ash-800 px-1.5 py-0.5 text-lava-300">!slot &lt;name&gt;</code> — pick your slot once
                  drawn
                </li>
              </ul>
            </GlassCard>
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div className="mt-16">
          <h3 className="font-heading text-center text-xs font-semibold uppercase tracking-widest text-ash-500">Past Games</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((g) => (
              <GlassCard key={g.id}>
                <div className="flex items-center justify-between">
                  <h4 className="font-heading text-sm font-semibold text-white">{g.title}</h4>
                  <Badge tone={statusTone[g.status]}>{g.status}</Badge>
                </div>
                <p className="mt-2 text-xs text-ash-400">
                  {g.gridSize}×{g.gridSize} · {g.lineWins.length} lines · {g.participants.length} players
                </p>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}
