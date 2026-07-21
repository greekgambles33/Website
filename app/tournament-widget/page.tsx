"use client";

import { useEffect, useState } from "react";
import { fetchTournaments, fetchTournament } from "@/lib/tournamentsApi";
import type { FullTournament, Tournament } from "@/lib/api";

const POLL_INTERVAL = 5000;
const ACTIVE_STATUSES: Tournament["status"][] = ["SLOT_SELECTION", "IN_PROGRESS", "REGISTRATION"];

const statusLabel: Record<Tournament["status"], string> = {
  DRAFT: "Draft",
  REGISTRATION: "Registration",
  SLOT_SELECTION: "Picking Slots",
  IN_PROGRESS: "Live",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};
const statusColor: Record<Tournament["status"], string> = {
  DRAFT: "#cbb8a8",
  REGISTRATION: "#ffa24d",
  SLOT_SELECTION: "#ffd15a",
  IN_PROGRESS: "#ff2d0f",
  COMPLETED: "#ffd15a",
  CANCELLED: "#6b4a33",
};

function pickCurrent(tournaments: Tournament[]): Tournament | null {
  for (const status of ACTIVE_STATUSES) {
    const match = tournaments.find((t) => t.status === status);
    if (match) return match;
  }
  const completed = tournaments
    .filter((t) => t.status === "COMPLETED")
    .sort((a, b) => new Date(b.completedAt ?? b.createdAt).getTime() - new Date(a.completedAt ?? a.createdAt).getTime());
  return completed[0] ?? null;
}

export default function TournamentWidgetPage() {
  const [tournament, setTournament] = useState<FullTournament | null>(null);

  useEffect(() => {
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";
    document.body.style.overflow = "hidden";

    let cancelled = false;
    const load = async () => {
      try {
        const all = await fetchTournaments();
        const pick = pickCurrent(all);
        const full = pick ? await fetchTournament(pick.id) : null;
        if (!cancelled) setTournament(full);
      } catch {
        // OBS has no session — silently retry on the next tick.
      }
    };
    load();
    const interval = setInterval(load, POLL_INTERVAL);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const box: React.CSSProperties = {
    width: 260,
    fontFamily: "var(--font-archivo, sans-serif)",
    color: "#f3e9df",
    background: "rgba(15,10,7,0.82)",
    border: "1px solid rgba(255,122,26,0.2)",
    borderRadius: 14,
    overflow: "hidden",
  };

  if (!tournament) {
    return (
      <div style={{ ...box, padding: "14px 16px", color: "#cbb8a8", fontSize: 12 }}>No active tournament</div>
    );
  }

  const champion = tournament.status === "COMPLETED" ? tournament.participants.find((p) => p.finalPosition === 1) : null;
  const activeMatches = tournament.matches.filter((m) => m.status === "ACTIVE");
  const remaining = tournament.participants.filter((p) => !p.eliminated).length;
  const participantsById = new Map(tournament.participants.map((p) => [p.id, p]));

  return (
    <div style={box}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderBottom: "1px solid rgba(255,122,26,0.16)",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {tournament.title}
        </span>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            color: statusColor[tournament.status],
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: 999, background: statusColor[tournament.status] }} />
          {statusLabel[tournament.status]}
        </span>
      </div>

      {champion ? (
        <div style={{ padding: "16px 14px", textAlign: "center" }}>
          <div style={{ fontSize: 22 }}>🏆</div>
          <div style={{ marginTop: 4, fontSize: 9, color: "#6b4a33", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Champion
          </div>
          <div style={{ marginTop: 2, fontWeight: 700, fontSize: 14 }}>{champion.user.displayName}</div>
        </div>
      ) : tournament.status === "REGISTRATION" ? (
        <div style={{ padding: "14px", textAlign: "center", fontSize: 12 }}>
          <span style={{ fontWeight: 700 }}>{tournament.entries.length}</span>{" "}
          <span style={{ color: "#6b4a33" }}>entered &middot; {tournament.maxPlayers} spots</span>
        </div>
      ) : tournament.status === "SLOT_SELECTION" ? (
        <div style={{ maxHeight: 220, overflowY: "auto" }}>
          {tournament.participants.slice(0, 8).map((p) => (
            <div
              key={p.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "6px 14px",
                fontSize: 11.5,
                borderBottom: "1px solid rgba(255,122,26,0.06)",
              }}
            >
              <span>{p.user.displayName}</span>
              <span style={{ color: p.slotConfirmed ? "#ffa24d" : "#6b4a33" }}>
                {p.slotConfirmed ? p.slotCall : "choosing…"}
              </span>
            </div>
          ))}
          {tournament.participants.length > 8 && (
            <div style={{ padding: "6px 14px", fontSize: 10.5, color: "#6b4a33" }}>
              +{tournament.participants.length - 8} more
            </div>
          )}
        </div>
      ) : (
        <div>
          <div style={{ padding: "8px 14px", fontSize: 11, color: "#6b4a33" }}>{remaining} players remaining</div>
          {activeMatches.slice(0, 4).map((m) => {
            const a = m.participantAId ? participantsById.get(m.participantAId) : undefined;
            const b = m.participantBId ? participantsById.get(m.participantBId) : undefined;
            return (
              <div
                key={m.id}
                style={{
                  padding: "7px 14px",
                  fontSize: 11.5,
                  borderTop: "1px solid rgba(255,122,26,0.08)",
                }}
              >
                <div>{a?.user.displayName ?? "TBD"}</div>
                <div style={{ color: "#6b4a33", fontSize: 9.5, margin: "1px 0" }}>vs</div>
                <div>{b?.user.displayName ?? "TBD"}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
