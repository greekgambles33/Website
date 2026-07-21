"use client";

import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FullTournament, TournamentMatch, TournamentParticipant } from "@/lib/api";

function slotLabel(p: TournamentParticipant | undefined): string {
  if (!p) return "TBD";
  return p.slotCall ? `${p.user.displayName} — ${p.slotCall}` : p.user.displayName;
}

function ParticipantRow({
  participant,
  isWinner,
  isDecided,
  canDeclare,
  onDeclare,
}: {
  participant: TournamentParticipant | undefined;
  isWinner: boolean;
  isDecided: boolean;
  canDeclare: boolean;
  onDeclare?: () => void;
}) {
  const content = (
    <div
      className={cn(
        "flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm",
        !participant && "text-ash-600",
        isDecided && isWinner && "bg-lava-500/15 text-white",
        isDecided && !isWinner && participant && "text-ash-500 line-through decoration-ash-600",
        !isDecided && participant && "text-white"
      )}
    >
      <span className="truncate">{slotLabel(participant)}</span>
      {isDecided && isWinner && <Crown size={13} className="shrink-0 text-gold-400" />}
    </div>
  );

  if (canDeclare && participant && onDeclare) {
    return (
      <button
        onClick={onDeclare}
        className="w-full rounded-lg text-left transition-colors hover:bg-lava-500/10"
      >
        {content}
      </button>
    );
  }
  return content;
}

export function TournamentBracket({
  tournament,
  isAdmin = false,
  onDeclareWinner,
  onRevertWinner,
}: {
  tournament: FullTournament;
  isAdmin?: boolean;
  onDeclareWinner?: (matchId: string, winnerId: string) => void;
  onRevertWinner?: (matchId: string) => void;
}) {
  const participantsById = new Map(tournament.participants.map((p) => [p.id, p]));
  const rounds = Array.from(new Set(tournament.matches.map((m) => m.round))).sort((a, b) => a - b);
  const matchesByRound = new Map<number, TournamentMatch[]>(
    rounds.map((r) => [
      r,
      tournament.matches.filter((m) => m.round === r).sort((a, b) => a.matchNumber - b.matchNumber),
    ])
  );

  const roundLabel = (round: number) => {
    const total = rounds.length;
    if (round === total) return "Final";
    if (round === total - 1) return "Semifinals";
    if (round === total - 2) return "Quarterfinals";
    return `Round ${round}`;
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max gap-6 px-1 pb-2">
        {rounds.map((round) => (
          <div key={round} className="flex w-64 shrink-0 flex-col justify-around gap-6">
            <p className="font-heading text-center text-xs font-bold uppercase tracking-[0.2em] text-lava-500">
              {roundLabel(round)}
            </p>
            {matchesByRound.get(round)!.map((match) => {
              const a = match.participantAId ? participantsById.get(match.participantAId) : undefined;
              const b = match.participantBId ? participantsById.get(match.participantBId) : undefined;
              const isBye = match.status === "COMPLETED" && (!match.participantAId || !match.participantBId);
              const canDeclare = isAdmin && match.status === "ACTIVE" && !!a && !!b;

              return (
                <div
                  key={match.id}
                  className={cn(
                    "glass-panel rounded-xl p-1.5",
                    match.status === "ACTIVE" && "border-lava-400/50"
                  )}
                >
                  <ParticipantRow
                    participant={a}
                    isWinner={match.winnerId === match.participantAId}
                    isDecided={match.status === "COMPLETED"}
                    canDeclare={canDeclare}
                    onDeclare={() => a && onDeclareWinner?.(match.id, a.id)}
                  />
                  <div className="my-0.5 border-t border-white/5" />
                  <ParticipantRow
                    participant={b}
                    isWinner={match.winnerId === match.participantBId}
                    isDecided={match.status === "COMPLETED"}
                    canDeclare={canDeclare}
                    onDeclare={() => b && onDeclareWinner?.(match.id, b.id)}
                  />
                  {isBye && (
                    <p className="px-3 pb-1 pt-0.5 text-[10px] uppercase tracking-widest text-ash-600">Bye</p>
                  )}
                  {isAdmin && match.status === "COMPLETED" && !isBye && onRevertWinner && (
                    <button
                      onClick={() => onRevertWinner(match.id)}
                      className="font-heading w-full pb-1 pt-0.5 text-center text-[10px] font-semibold uppercase tracking-widest text-ash-500 hover:text-crimson-300"
                    >
                      Revert
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
