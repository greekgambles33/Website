"use client";

import { useCallback, useEffect, useState } from "react";
import { Gift, Ticket, Trophy, Loader2 } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCountdown } from "@/lib/hooks/useCountdown";
import {
  fetchGiveaways,
  fetchMyGiveawayEntry,
  enterGiveaway,
  leaveGiveaway,
  GiveawayApiError,
} from "@/lib/giveawaysApi";
import type { Giveaway } from "@/lib/api";

function GiveawayCountdown({ endsAt }: { endsAt: string }) {
  const countdown = useCountdown(new Date(endsAt));
  if (!countdown) return null;
  return (
    <div className="font-display flex gap-2 text-xl font-bold text-white">
      <span>{countdown.days}d</span>
      <span className="text-lava-400">{countdown.hours}h</span>
      <span>{countdown.minutes}m</span>
    </div>
  );
}

function ActiveGiveawayCard({ giveaway, onChanged }: { giveaway: Giveaway; onChanged: () => void }) {
  const { user } = useAuth();
  const [entered, setEntered] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchMyGiveawayEntry(giveaway.id).then(setEntered).catch(() => {});
  }, [user, giveaway.id]);

  const handleToggle = async () => {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      if (entered) {
        await leaveGiveaway(giveaway.id);
        setEntered(false);
      } else {
        await enterGiveaway(giveaway.id);
        setEntered(true);
      }
      onChanged();
    } catch (err) {
      setError(err instanceof GiveawayApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <GlassCard glow className="mx-auto max-w-2xl">
      <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-crimson-500 to-lava-500">
            <Gift size={26} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{giveaway.title}</h3>
            {giveaway.description && <p className="mt-1 text-sm text-ash-300">{giveaway.description}</p>}
            <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-ash-300 sm:justify-start">
              <Ticket size={14} className="text-lava-400" />
              {giveaway._count.entries.toLocaleString()} entries
              {giveaway.entryCost > 0 ? ` · ${giveaway.entryCost.toLocaleString()} HellCatCoins per entry` : " · free entry"}
            </p>
            {giveaway.requirementText && (
              <p className="mt-1.5 text-xs font-medium text-gold-400">{giveaway.requirementText}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          {giveaway.endsAt && <GiveawayCountdown endsAt={giveaway.endsAt} />}
          <Badge tone="lava">Entries Open</Badge>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center gap-2 sm:items-start">
        {user ? (
          <Button variant={entered ? "secondary" : "primary"} disabled={busy} onClick={handleToggle}>
            {busy ? "Working…" : entered ? "Withdraw Entry" : "Enter Giveaway"}
          </Button>
        ) : (
          <p className="text-xs text-ash-400">Log in to enter.</p>
        )}
        {error && <p className="text-xs text-crimson-400">{error}</p>}
      </div>
    </GlassCard>
  );
}

export default function GiveawaysPage() {
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    fetchGiveaways()
      .then(setGiveaways)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const active = giveaways.filter((g) => g.status === "OPEN");
  const winners = giveaways.filter((g) => g.status === "COMPLETED" && g.winner);

  return (
    <>
      <Section>
        <SectionHeading eyebrow="Enter to Win" title="Active Giveaways" />

        {loading ? (
          <div className="mt-12 flex justify-center">
            <Loader2 size={24} className="animate-spin text-lava-400" />
          </div>
        ) : active.length === 0 ? (
          <p className="mt-12 text-center text-sm text-ash-400">No giveaway is running right now — check back soon.</p>
        ) : (
          <div className="mt-12 space-y-6">
            {active.map((g) => (
              <ActiveGiveawayCard key={g.id} giveaway={g} onChanged={load} />
            ))}
          </div>
        )}
      </Section>

      {winners.length > 0 && (
        <Section className="pt-0">
          <SectionHeading eyebrow="Hall of Flame" title="Past Winners" />

          <div className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-2">
            {winners.map((g) => (
              <GlassCard key={g.id} className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold-500/10 text-gold-400">
                  <Trophy size={22} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{g.winner!.displayName}</p>
                  <p className="text-xs text-lava-300">{g.title}</p>
                  {g.drawnAt && (
                    <p className="mt-0.5 text-xs text-ash-500">
                      {new Date(g.drawnAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </p>
                  )}
                </div>
              </GlassCard>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
