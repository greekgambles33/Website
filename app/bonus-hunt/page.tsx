"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Flame, ArrowLeft } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassCard } from "@/components/ui/GlassCard";
import { InfoModal, InfoButton } from "@/components/ui/InfoModal";
import { HuntDisplay } from "@/components/bonus-hunt/HuntDisplay";
import { fetchLiveHunt, HuntApiError } from "@/lib/huntsApi";
import type { Hunt } from "@/lib/api";

const POLL_INTERVAL = 5000;

export default function BonusHuntPage() {
  const [hunt, setHunt] = useState<Hunt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<"how" | "rules" | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const live = await fetchLiveHunt();
        if (!cancelled) {
          setHunt(live);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof HuntApiError ? err.message : "Failed to load the hunt");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, POLL_INTERVAL);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <Section>
      {!hunt && (
        <SectionHeading
          eyebrow="Live Collection"
          title="Bonus Hunt"
          description="Follow the live bonus hunt — bet size, multiplier, and payout as every slot in the collection gets opened."
        />
      )}

      <div className="mb-8 flex justify-center gap-2">
        <InfoButton label="How to Play" onClick={() => setModal("how")} />
        <InfoButton label="Rules" onClick={() => setModal("rules")} />
      </div>

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2 size={28} className="animate-spin text-lava-400" />
        </div>
      ) : error ? (
        <p className="py-16 text-center text-sm text-crimson-400">{error}</p>
      ) : hunt ? (
        <HuntDisplay hunt={hunt} />
      ) : (
        <GlassCard className="mx-auto mt-8 flex max-w-lg flex-col items-center gap-3 py-14 text-center">
          <Flame size={28} className="text-lava-400/60" />
          <h2 className="text-lg font-semibold text-white">No Active Hunt</h2>
          <p className="text-sm text-ash-300">
            Nothing&apos;s being tracked live right now — check the schedule for the next stream and this page
            will light up the moment a hunt goes live.
          </p>
          <Link
            href="/games"
            className="font-heading mt-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-lava-300 hover:text-white"
          >
            <ArrowLeft size={14} />
            Back to Stream Games
          </Link>
        </GlassCard>
      )}

      {modal === "how" && (
        <InfoModal title="How Bonus Hunt Works" onClose={() => setModal(null)}>
          <p>
            Before going live, the streamer buys bonus rounds across a whole collection of slots without opening
            any of them — that&apos;s the &ldquo;collecting&rdquo; phase.
          </p>
          <p>
            Once collecting wraps up, every bonus gets opened live on stream, one at a time. This page updates
            automatically as each one lands — no need to refresh.
          </p>
          <p>
            Watch the stats up top: how many bonuses are left, the current profit or loss against the starting
            balance, and which slot has paid out the biggest multiplier so far.
          </p>
        </InfoModal>
      )}

      {modal === "rules" && (
        <InfoModal title="Rules" onClose={() => setModal(null)}>
          <ul className="space-y-2">
            <li>&bull; All bets and payouts are tracked in the stream&apos;s real currency, not HellCatCoins.</li>
            <li>&bull; The hunt moves through three stages: Collecting, Opening, and Completed.</li>
            <li>&bull; Bonuses are opened live in whatever order the streamer chooses.</li>
            <li>&bull; This page is a spectator tracker — there&apos;s no wagering or entry involved for viewers.</li>
          </ul>
        </InfoModal>
      )}
    </Section>
  );
}
