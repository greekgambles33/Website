import { Section } from "@/components/ui/Section";
import { StatTile } from "@/components/ui/StatTile";
import { communityStats } from "@/lib/mock-data";

export function CommunityStats() {
  return (
    <Section className="py-14 sm:py-16">
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {communityStats.map((stat) => (
          <StatTile key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </div>
    </Section>
  );
}
