import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Section } from "@/components/ui/Section";
import { CoinFeature } from "@/components/home/CoinFeature";
import { CommunityStats } from "@/components/home/CommunityStats";
import { Announcements } from "@/components/home/Announcements";
import { CommunityHighlights } from "@/components/home/CommunityHighlights";

export const metadata: Metadata = {
  title: "About | GreekGodBerry",
  description: "The community behind GreekGodBerry — HellCatCoins, stats, announcements, and what people are saying.",
};

export default function AboutPage() {
  return (
    <>
      <Section className="pb-0">
        <SectionHeading
          eyebrow="The Community"
          title="About GreekGodBerry"
          description="333 nights of fire, one raid at a time — here's what powers it."
        />
      </Section>
      <CommunityStats />
      <CoinFeature />
      <Announcements />
      <CommunityHighlights />
    </>
  );
}
