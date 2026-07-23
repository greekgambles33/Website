"use client";

import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Coin } from "@/components/ui/Coin";
import { useSiteContent } from "@/lib/hooks/useSiteContent";
import type { GiveawayContent, UpcomingGiveawayContent, LatestWinnerContent } from "@/lib/api";
import { useCountdown } from "@/lib/hooks/useCountdown";
import { Gift, Ticket, Trophy } from "lucide-react";

export default function GiveawaysPage() {
  const { data: giveaway } = useSiteContent<GiveawayContent>("giveaway");
  const { data: upcoming } = useSiteContent<UpcomingGiveawayContent[]>("upcoming_giveaways");
  const { data: winners } = useSiteContent<LatestWinnerContent[]>("latest_winners");
  const countdown = useCountdown(giveaway ? new Date(giveaway.endsAt) : new Date());

  return (
    <>
      <Section>
        <SectionHeading eyebrow="Enter to Win" title="Active Giveaway" />

        {!giveaway ? (
          <p className="mt-12 text-center text-sm text-ash-400">No giveaway is running right now — check back soon.</p>
        ) : (
          <GlassCard glow className="mx-auto mt-12 max-w-2xl">
            <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-crimson-500 to-lava-500">
                  <Gift size={26} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {giveaway.title}
                  </h3>
                  <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-ash-300 sm:justify-start">
                    <Ticket size={14} className="text-lava-400" />
                    {giveaway.totalEntries.toLocaleString()} entries ·{" "}
                    {giveaway.entryCost.toLocaleString()} HellCatCoins per entry
                    {giveaway.freeEntryAvailable && " · free entry available"}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3">
                <div className="font-display flex gap-2 text-xl font-bold text-white">
                  {countdown ? (
                    <>
                      <span>{countdown.days}d</span>
                      <span className="text-lava-400">{countdown.hours}h</span>
                      <span>{countdown.minutes}m</span>
                    </>
                  ) : (
                    <span className="text-sm font-normal text-ash-300">Loading…</span>
                  )}
                </div>
                <Badge tone={giveaway.entriesOpen ? "lava" : "neutral"}>
                  {giveaway.entriesOpen ? "Entries Open" : "Entries Closed"}
                </Badge>
              </div>
            </div>

            <div className="mt-6 flex justify-center sm:justify-start">
              <Button>Enter Giveaway</Button>
            </div>
          </GlassCard>
        )}
      </Section>

      {upcoming && upcoming.length > 0 && (
        <Section className="pt-0">
          <SectionHeading eyebrow="Coming Up" title="Upcoming Giveaways" />

          <div className="mx-auto mt-12 grid max-w-2xl gap-6 sm:grid-cols-2">
            {upcoming.map((g) => (
              <GlassCard key={g.id} className="flex flex-col">
                <h3 className="text-base font-semibold text-white">{g.title}</h3>
                <p className="mt-2 text-xs text-ash-300">
                  Starts {new Date(g.startsAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-lava-300">
                  <Coin size="xs" />
                  <span className="font-heading text-sm font-bold">
                    {g.entryCost.toLocaleString()}
                  </span>
                  {g.freeEntryAvailable && (
                    <Badge tone="neutral" className="ml-2">
                      Free entry available
                    </Badge>
                  )}
                </div>
              </GlassCard>
            ))}
          </div>
        </Section>
      )}

      {winners && winners.length > 0 && (
        <Section className="pt-0">
          <SectionHeading eyebrow="Hall of Flame" title="Past Winners" />

          <div className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-2">
            {winners.map((winner) => (
              <GlassCard key={winner.id} className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold-500/10 text-gold-400">
                  <Trophy size={22} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{winner.username}</p>
                  <p className="text-xs text-lava-300">{winner.prize}</p>
                  <p className="mt-0.5 text-xs text-ash-500">{winner.date}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
