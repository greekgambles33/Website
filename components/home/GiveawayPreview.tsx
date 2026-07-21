"use client";

import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { giveawayPreview } from "@/lib/mock-data";
import { useCountdown } from "@/lib/hooks/useCountdown";
import { Gift, Ticket } from "lucide-react";

export function GiveawayPreview() {
  const countdown = useCountdown(giveawayPreview.endsAt);

  return (
    <Section id="giveaways">
      <SectionHeading eyebrow="Enter to Win" title="Active Giveaway" />

      <GlassCard glow className="mx-auto mt-12 max-w-2xl">
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-crimson-500 to-lava-500">
              <Gift size={26} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {giveawayPreview.title}
              </h3>
              <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-ash-300 sm:justify-start">
                <Ticket size={14} className="text-lava-400" />
                {giveawayPreview.totalEntries.toLocaleString()} entries ·{" "}
                {giveawayPreview.entryCost.toLocaleString()} HellCatCoins per entry
                {giveawayPreview.freeEntryAvailable && " · free entry available"}
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
            <Badge tone={giveawayPreview.entriesOpen ? "lava" : "neutral"}>
              {giveawayPreview.entriesOpen ? "Entries Open" : "Entries Closed"}
            </Badge>
          </div>
        </div>

        <div className="mt-6 flex justify-center sm:justify-start">
          <ButtonLink href="/giveaways">Enter Giveaway</ButtonLink>
        </div>
      </GlassCard>
    </Section>
  );
}
