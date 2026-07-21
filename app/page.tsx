import { Hero } from "@/components/home/Hero";
import { CommunityStats } from "@/components/home/CommunityStats";
import { ScheduleTeaser } from "@/components/home/ScheduleTeaser";
import { CoinFeature } from "@/components/home/CoinFeature";
import { GamesTeaser } from "@/components/home/GamesTeaser";
import { LeaderboardPreview } from "@/components/home/LeaderboardPreview";
import { StorePreview } from "@/components/home/StorePreview";
import { GiveawayPreview } from "@/components/home/GiveawayPreview";
import { LatestWinners } from "@/components/home/LatestWinners";
import { Announcements } from "@/components/home/Announcements";
import { CommunityHighlights } from "@/components/home/CommunityHighlights";
import { LavaCracks } from "@/components/effects/LavaCracks";

export default function Home() {
  return (
    <>
      <Hero />
      <LavaCracks />
      <CommunityStats />
      <ScheduleTeaser />
      <CoinFeature />
      <GamesTeaser />
      <LeaderboardPreview />
      <StorePreview />
      <GiveawayPreview />
      <LatestWinners />
      <Announcements />
      <CommunityHighlights />
    </>
  );
}
