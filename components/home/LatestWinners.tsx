"use client";

import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassCard } from "@/components/ui/GlassCard";
import { useSiteContent } from "@/lib/hooks/useSiteContent";
import type { LatestWinnerContent } from "@/lib/api";
import { Trophy } from "lucide-react";

export function LatestWinners() {
  const { data: winners } = useSiteContent<LatestWinnerContent[]>("latest_winners");

  if (!winners || winners.length === 0) return null;

  return (
    <Section>
      <SectionHeading eyebrow="Hall of Flame" title="Latest Winners" />

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
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
  );
}
