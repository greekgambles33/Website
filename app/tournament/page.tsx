"use client";

import { useCallback, useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassCard } from "@/components/ui/GlassCard";
import { InfoModal, InfoButton } from "@/components/ui/InfoModal";
import { TournamentView, TournamentLoading } from "@/components/tournament/TournamentView";
import { fetchTournaments, fetchTournament, TournamentApiError } from "@/lib/tournamentsApi";
import type { FullTournament, Tournament } from "@/lib/api";

const POLL_INTERVAL = 5000;
const ACTIVE_STATUSES: Tournament["status"][] = ["SLOT_SELECTION", "IN_PROGRESS", "REGISTRATION"];

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

export default function TournamentPage() {
  const [current, setCurrent] = useState<FullTournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<"how" | "rules" | null>(null);

  const load = useCallback(async () => {
    try {
      const all = await fetchTournaments();
      const pick = pickCurrent(all);
      if (!pick) {
        setCurrent(null);
      } else {
        setCurrent(await fetchTournament(pick.id));
      }
      setError(null);
    } catch (err) {
      setError(err instanceof TournamentApiError ? err.message : "Failed to load tournaments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <>
      <Section className="pb-0">
        {!current && (
          <SectionHeading
            eyebrow="Slot Call Knockout"
            title="Slot Tournament"
            description="Enter the draw, call your slot, and battle head-to-head live on stream until one champion is left standing."
          />
        )}

        <div className="mb-8 flex justify-center gap-2">
          <InfoButton label="How to Play" onClick={() => setModal("how")} />
          <InfoButton label="Rules" onClick={() => setModal("rules")} />
        </div>

        {loading ? (
          <TournamentLoading />
        ) : error ? (
          <p className="py-16 text-center text-sm text-crimson-400">{error}</p>
        ) : current ? (
          <TournamentView tournament={current} onRefresh={load} />
        ) : (
          <GlassCard className="mx-auto mt-8 flex max-w-lg flex-col items-center gap-3 py-14 text-center">
            <Trophy size={28} className="text-lava-400/60" />
            <h2 className="text-lg font-semibold text-white">No Tournament Right Now</h2>
            <p className="text-sm text-ash-300">
              Check back once the next slot tournament opens for registration — you&apos;ll be able to enter the
              draw right here.
            </p>
          </GlassCard>
        )}

        {modal === "how" && (
          <InfoModal title="How Slot Tournament Works" onClose={() => setModal(null)}>
            <p>
              When registration opens, enter the draw. If you&apos;re picked, you&apos;ll get a countdown to lock
              in the one slot you&apos;ll play for the entire tournament — choose carefully, you can&apos;t
              change it later.
            </p>
            <p>
              Once everyone&apos;s confirmed, a bracket forms with random matchups. Each round, the streamer plays
              both players&apos; called slots live on stream — whoever&apos;s slot pays out bigger advances,
              round by round, until one champion is left.
            </p>
            <p>Any HellCatCoin prize for the tournament is shown at the top of the page when one&apos;s set.</p>
          </InfoModal>
        )}

        {modal === "rules" && (
          <InfoModal title="Rules" onClose={() => setModal(null)}>
            <ul className="space-y-2">
              <li>&bull; One slot call per player, locked in for the whole run — no changing after confirming.</li>
              <li>&bull; Slot names must be unique per tournament — first to call it gets it.</li>
              <li>&bull; Miss your slot-call deadline and you may be rerolled out for another entrant.</li>
              <li>&bull; Match winners are decided by the streamer based on the live result.</li>
              <li>&bull; One entry per person — multi-accounting gets you pulled from the draw.</li>
            </ul>
          </InfoModal>
        )}
      </Section>
    </>
  );
}
