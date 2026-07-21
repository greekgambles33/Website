"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Crown, Clock, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Coin } from "@/components/ui/Coin";
import { TournamentBracket } from "@/components/tournament/TournamentBracket";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCountdown } from "@/lib/hooks/useCountdown";
import { fetchMyEntry, enterRaffle, leaveRaffle, setSlot, TournamentApiError } from "@/lib/tournamentsApi";
import type { FullTournament, TournamentParticipant } from "@/lib/api";

const statusTone = {
  DRAFT: "neutral",
  REGISTRATION: "lava",
  SLOT_SELECTION: "live",
  IN_PROGRESS: "live",
  COMPLETED: "gold",
  CANCELLED: "neutral",
} as const;

const statusLabel = {
  DRAFT: "Draft",
  REGISTRATION: "Registration Open",
  SLOT_SELECTION: "Picking Slots",
  IN_PROGRESS: "Live",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
} as const;

function SlotDeadline({ deadline }: { deadline: string }) {
  const countdown = useCountdown(new Date(deadline));
  if (!countdown) return null;
  if (countdown.days === 0 && countdown.hours === 0 && countdown.minutes === 0 && countdown.seconds === 0) {
    return <span className="text-crimson-400">Time&apos;s up</span>;
  }
  return (
    <span className="flex items-center gap-1">
      <Clock size={12} />
      {String(countdown.minutes).padStart(2, "0")}:{String(countdown.seconds).padStart(2, "0")}
    </span>
  );
}

export function TournamentView({ tournament, onRefresh }: { tournament: FullTournament; onRefresh: () => void }) {
  const { user } = useAuth();
  const [myParticipant, setMyParticipant] = useState<TournamentParticipant | null>(null);
  const [entered, setEntered] = useState(false);
  const [busy, setBusy] = useState(false);
  const [slotInput, setSlotInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || tournament.status === "COMPLETED" || tournament.status === "CANCELLED") return;
    fetchMyEntry(tournament.id)
      .then((data) => {
        setEntered(data.entered);
        setMyParticipant(data.participant as TournamentParticipant | null);
      })
      .catch(() => {});
  }, [user, tournament.id, tournament.status]);

  const handleEnter = async (join: boolean) => {
    setBusy(true);
    setError(null);
    try {
      if (join) await enterRaffle(tournament.id);
      else await leaveRaffle(tournament.id);
      setEntered(join);
    } catch (err) {
      setError(err instanceof TournamentApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const handleSetSlot = async () => {
    if (!slotInput.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await setSlot(tournament.id, slotInput.trim());
      onRefresh();
    } catch (err) {
      setError(err instanceof TournamentApiError ? err.message : "Failed to lock in slot");
    } finally {
      setBusy(false);
    }
  };

  const champion =
    tournament.status === "COMPLETED" ? tournament.participants.find((p) => p.finalPosition === 1) : null;

  return (
    <div>
      <div className="flex flex-col items-center gap-3 text-center">
        <Badge tone={statusTone[tournament.status]} pulse={tournament.status === "IN_PROGRESS"}>
          {statusLabel[tournament.status]}
        </Badge>
        <h1 className="text-ember text-3xl sm:text-4xl">{tournament.title}</h1>
        {tournament.prizeCoins > 0 && (
          <div className="flex items-center gap-1.5 text-sm">
            <Coin size="xs" />
            <span className="font-heading font-bold text-lava-300">
              {tournament.prizeCoins.toLocaleString()} to the champion
            </span>
          </div>
        )}
      </div>

      {champion && (
        <GlassCard glow className="mx-auto mt-8 flex max-w-md flex-col items-center gap-2 py-8 text-center">
          <Crown size={28} className="text-gold-400" />
          <p className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-300">Champion</p>
          <p className="text-xl font-semibold text-white">{champion.user.displayName}</p>
          {champion.slotCall && <p className="text-sm text-ash-400">{champion.slotCall}</p>}
        </GlassCard>
      )}

      {tournament.status === "REGISTRATION" && (
        <GlassCard className="mx-auto mt-8 flex max-w-md flex-col items-center gap-3 py-8 text-center">
          <p className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-300">
            {tournament.entries.length} entered &middot; {tournament.maxPlayers} spots
          </p>
          {!user ? (
            <p className="text-sm text-ash-400">Log in to enter the draw.</p>
          ) : (
            <button
              disabled={busy}
              onClick={() => handleEnter(!entered)}
              className={
                entered
                  ? "font-heading rounded-[10px] border border-crimson-400/40 px-6 py-2.5 text-xs font-bold uppercase tracking-wide text-crimson-300 disabled:opacity-50"
                  : "font-heading rounded-[10px] bg-gradient-to-b from-lava-300 to-lava-400 px-6 py-2.5 text-xs font-bold uppercase tracking-wide text-[#140a04] disabled:opacity-50"
              }
            >
              {entered ? "Leave Draw" : "Enter Draw"}
            </button>
          )}
          {error && <p className="text-xs text-crimson-400">{error}</p>}
        </GlassCard>
      )}

      {tournament.status === "SLOT_SELECTION" && (
        <div className="mx-auto mt-8 max-w-md space-y-4">
          {myParticipant && !myParticipant.slotConfirmed && (
            <GlassCard glow className="flex flex-col items-center gap-3 py-6 text-center">
              <p className="font-heading text-xs font-semibold uppercase tracking-widest text-lava-500">
                You&apos;re In — Call Your Slot
              </p>
              {myParticipant.slotDeadline && <SlotDeadline deadline={myParticipant.slotDeadline} />}
              <div className="flex w-full gap-2">
                <input
                  value={slotInput}
                  onChange={(e) => setSlotInput(e.target.value)}
                  placeholder="Sweet Bonanza"
                  className="ggb-input"
                />
                <button
                  disabled={busy}
                  onClick={handleSetSlot}
                  className="font-heading shrink-0 rounded-[10px] bg-gradient-to-b from-lava-300 to-lava-400 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[#140a04] disabled:opacity-50"
                >
                  Lock In
                </button>
              </div>
              {error && <p className="text-xs text-crimson-400">{error}</p>}
            </GlassCard>
          )}

          <GlassCard className="p-0">
            <p className="font-heading border-b border-white/5 px-5 py-3 text-xs font-semibold uppercase tracking-widest text-ash-300">
              Drawn Players
            </p>
            <div className="divide-y divide-white/5">
              {tournament.participants.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-white">{p.user.displayName}</span>
                  {p.slotConfirmed ? (
                    <span className="text-xs text-lava-300">{p.slotCall}</span>
                  ) : (
                    <span className="text-xs text-ash-500">Choosing…</span>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {(tournament.status === "IN_PROGRESS" || tournament.status === "COMPLETED") && (
        <div className="mt-10">
          <TournamentBracket tournament={tournament} />
        </div>
      )}

      {tournament.status === "CANCELLED" && (
        <p className="mt-8 text-center text-sm text-ash-400">This tournament was cancelled.</p>
      )}
    </div>
  );
}

export function TournamentListItem({ tournament }: { tournament: FullTournament }) {
  return (
    <Link href={`/tournament/${tournament.id}`}>
      <GlassCard className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-white">{tournament.title}</p>
          <p className="text-xs text-ash-500">{new Date(tournament.createdAt).toLocaleDateString()}</p>
        </div>
        <Badge tone={statusTone[tournament.status]}>{statusLabel[tournament.status]}</Badge>
      </GlassCard>
    </Link>
  );
}

export function TournamentLoading() {
  return (
    <div className="flex min-h-[300px] items-center justify-center">
      <Loader2 size={24} className="animate-spin text-lava-400" />
    </div>
  );
}
