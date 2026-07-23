"use client";

import { Section } from "@/components/ui/Section";
import { StatTile } from "@/components/ui/StatTile";
import { useSiteContent } from "@/lib/hooks/useSiteContent";
import type { CommunityStat } from "@/lib/api";

export function CommunityStats() {
  const { data: stats } = useSiteContent<CommunityStat[]>("community_stats");

  if (!stats || stats.length === 0) return null;

  return (
    <Section className="py-14 sm:py-16">
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatTile key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </div>
    </Section>
  );
}
