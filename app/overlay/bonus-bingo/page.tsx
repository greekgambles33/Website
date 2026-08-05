"use client";

import { useEffect, useState } from "react";
import { fetchActiveBingoGame } from "@/lib/streamGamesApi";
import { participantName, lineLabel, wonCellKeys } from "@/lib/bingoUtils";
import type { BingoGame } from "@/lib/api";

const SLUG = "bonus-bingo";
const POLL_MS = 3000;

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Draft", color: "#6b7280" },
  REGISTRATION: { label: "Registering", color: "#3b82f6" },
  ACTIVE: { label: "Live", color: "#22c55e" },
  COMPLETED: { label: "Done", color: "#eab308" },
  CANCELLED: { label: "Cancelled", color: "#ef4444" },
};

function MiniGrid({ game }: { game: BingoGame }) {
  const size = 160;
  const gap = 3;
  const cellSize = (size - gap * (game.gridSize - 1)) / game.gridSize;
  const wonKeys = wonCellKeys(game.cells, game.lineWins, game.gridSize);

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${game.gridSize}, ${cellSize}px)`, gap }}>
      {game.cells.map((cell) => {
        const isWon = wonKeys.has(`${cell.row}:${cell.col}`);
        const bg = cell.status === "GREEN" ? "rgba(34,197,94,0.25)" : cell.status === "ACTIVE" ? "rgba(234,179,8,0.2)" : "rgba(255,255,255,0.04)";
        const border = isWon ? "1px solid #eab308" : cell.status === "ACTIVE" ? "1px solid rgba(234,179,8,0.6)" : "1px solid rgba(255,255,255,0.06)";
        return (
          <div
            key={cell.id}
            style={{
              width: cellSize,
              height: cellSize,
              background: bg,
              border,
              borderRadius: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {cell.status === "GREEN" && (
              <span style={{ fontSize: 6, color: "#bbf7d0", fontWeight: 700, textAlign: "center", lineHeight: 1.1, padding: "0 1px" }}>
                {cell.claimedByChatUsername}
              </span>
            )}
            {cell.status === "ACTIVE" &&
              (game.currentChatUsername ? (
                <span style={{ fontSize: 6, color: "#fde68a", fontWeight: 700, textAlign: "center", lineHeight: 1.1, padding: "0 1px" }}>
                  {game.currentChatUsername}
                </span>
              ) : (
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#eab308", opacity: 0.8 }} className="animate-pulse" />
              ))}
          </div>
        );
      })}
    </div>
  );
}

export default function BonusBingoOverlayPage() {
  const [game, setGame] = useState<BingoGame | null>(null);

  useEffect(() => {
    document.body.style.background = "transparent";
    document.documentElement.style.background = "transparent";
  }, []);

  useEffect(() => {
    const load = () => fetchActiveBingoGame(SLUG).then(setGame).catch(() => {});
    load();
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  if (!game || game.status === "DRAFT") {
    return (
      <div style={{ width: 180, fontFamily: "sans-serif" }}>
        <div style={{ background: "rgba(10,10,10,0.85)", borderRadius: 10, padding: 10, color: "#9ca3af", fontSize: 11, textAlign: "center" }}>
          🎱 Waiting for Bingo…
        </div>
      </div>
    );
  }

  const cfg = STATUS_CFG[game.status];
  const winners = game.participants.filter((p) => game.cells.some((c) => c.status === "GREEN" && c.claimedByChatUsername === p.chatUsername));

  return (
    <div style={{ width: 180, fontFamily: "sans-serif" }}>
      <div style={{ background: "rgba(10,10,10,0.9)", borderRadius: 10, padding: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: "#fff", fontWeight: 700 }}>🎲 {game.title.length > 16 ? `${game.title.slice(0, 16)}…` : game.title}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, color: cfg.color, fontWeight: 700 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.color }} className={game.status === "ACTIVE" ? "animate-pulse" : undefined} />
            {cfg.label}
          </span>
        </div>

        <MiniGrid game={game} />

        {game.status === "ACTIVE" && game.currentChatUsername && (
          <div style={{ marginTop: 8, background: "rgba(234,179,8,0.12)", border: "1px solid rgba(234,179,8,0.3)", borderRadius: 6, padding: "6px 8px" }}>
            <p style={{ fontSize: 8, color: "#fde68a", textTransform: "uppercase", letterSpacing: 0.5, margin: 0 }}>▶ Now Playing</p>
            <p style={{ fontSize: 11, color: "#fff", fontWeight: 700, margin: "2px 0 0" }}>{game.currentChatUsername}</p>
            {game.cells.find((c) => c.id === game.currentCellId)?.slotName && (
              <p style={{ fontSize: 9, color: "#d1d5db", margin: "1px 0 0" }}>{game.cells.find((c) => c.id === game.currentCellId)?.slotName}</p>
            )}
          </div>
        )}

        {game.participants.length > 0 && (
          <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 6px" }}>
            {game.participants.slice(0, 10).map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 8, color: "#d1d5db", overflow: "hidden" }}>
                <span>{p.chatUsername === game.currentChatUsername ? "▶" : winners.includes(p) ? "🏆" : "·"}</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{participantName(p)}</span>
              </div>
            ))}
            {game.participants.length > 10 && (
              <div style={{ fontSize: 8, color: "#6b7280" }}>+{game.participants.length - 10} more</div>
            )}
          </div>
        )}

        {game.lineWins.length > 0 && (
          <div style={{ marginTop: 8, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 6 }}>
            {game.lineWins.slice(-3).map((w) => (
              <p key={w.id} style={{ fontSize: 8, color: "#a7f3d0", margin: "1px 0" }}>
                🟩 {lineLabel(w.lineType, w.lineIndex)} · {w.pointsEach} pts
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
