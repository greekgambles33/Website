"use client";

import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassCard } from "@/components/ui/GlassCard";
import { useSiteContent } from "@/lib/hooks/useSiteContent";
import type { CommunityHighlightContent } from "@/lib/api";
import { Quote } from "lucide-react";

export function CommunityHighlights() {
  const { data: highlights } = useSiteContent<CommunityHighlightContent[]>("community_highlights");

  if (!highlights || highlights.length === 0) return null;

  return (
    <Section>
      <SectionHeading eyebrow="From the Den" title="Community Highlights" />

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {highlights.map((h) => (
          <GlassCard key={h.id}>
            <Quote size={20} className="text-lava-500/60" />
            <p className="mt-3 text-sm text-ash-100">&ldquo;{h.quote}&rdquo;</p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-ash-500">
              — {h.username}
            </p>
          </GlassCard>
        ))}
      </div>
    </Section>
  );
}
