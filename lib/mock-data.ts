export const socials = [
  { name: "Kick", href: "https://kick.com/greekgodberry", icon: "kick" },
  { name: "Discord", href: "https://discord.gg/wgaGbXxQ5", icon: "discord" },
  { name: "Twitch", href: "https://www.twitch.tv/greekgodberry", icon: "twitch" },
  { name: "YouTube", href: "https://www.youtube.com/@greekgodberry", icon: "youtube" },
  { name: "Instagram", href: "https://www.instagram.com/greekgodberry/?hl=en", icon: "instagram" },
  { name: "X", href: "https://x.com/greekgodberryx", icon: "x" },
] as const;

export const streamStatus = {
  isLive: true,
  title: "Slot Odyssey — Chasing the Volcano Bonus",
  category: "Slots",
  viewers: 4218,
  uptimeMinutes: 187,
};

export const heroHighlights = [
  { label: "Followers", value: "412K" },
  { label: "Nights Streamed", value: "333" },
  { label: "Rewards Paid", value: "$310K" },
];

type ScheduleDay = {
  day: string;
  date: string;
  time: string;
  title: string;
  live: boolean;
  off?: boolean;
};

export const schedule: ScheduleDay[] = [
  { day: "Mon", date: "Jul 20", time: "8:00 PM EST", title: "High Stakes Monday", live: false },
  { day: "Tue", date: "Jul 21", time: "8:00 PM EST", title: "Bonus Hunt Grind", live: false },
  { day: "Wed", date: "Jul 22", time: "Off", title: "Rest Day", live: false, off: true },
  { day: "Thu", date: "Jul 23", time: "8:00 PM EST", title: "Viewer Picks Night", live: false },
  { day: "Fri", date: "Jul 24", time: "9:00 PM EST", title: "Community Cashout Friday", live: false },
  { day: "Sat", date: "Jul 25", time: "9:00 PM EST", title: "Weekend Slot Odyssey", live: false },
  { day: "Sun", date: "Jul 26", time: "7:00 PM EST", title: "Giveaway Sunday", live: false },
];

export const nextStreamAt = new Date("2026-07-20T20:00:00-04:00");

export const communityStats = [
  { label: "Members", value: 18240 },
  { label: "HellCatCoins In Circulation", value: 5_412_900 },
  { label: "Streams Hosted", value: 612 },
  { label: "Giveaways Run", value: 148 },
];

export const announcements = [
  {
    id: "a1",
    title: "Kick verification is now required for chat rewards",
    body: "Link your Kick username in your dashboard to keep earning HellCatCoins from chat activity.",
    date: "Jul 16",
    pinned: true,
  },
  {
    id: "a2",
    title: "New store item: Bonus Buy Request",
    body: "Spend HellCatCoins to queue a bonus buy live on stream. Limited slots per session.",
    date: "Jul 14",
  },
  {
    id: "a3",
    title: "Viewer Picks returns Thursday",
    body: "Vote on which slot goes first — live odds update every 30 seconds.",
    date: "Jul 12",
  },
];

export const featuredGames = [
  {
    id: "bonus-hunt",
    name: "Bonus Hunt",
    description: "Track a live hunt through the collection and call the final leaderboard before cashout.",
    status: "Live",
    participants: 342,
    href: "/bonus-hunt",
    howToPlay:
      "Join the hunt lobby from your dashboard before the session starts. Pick a slot from the collection board and predict where it'll land on the final cashout leaderboard. Closest guess without going over wins a HellCatCoin bonus.",
  },
  {
    id: "tournament",
    name: "Tournament",
    description: "A week-long wager race — top 5 highest wagerers split the prize pool.",
    status: "Live",
    participants: 512,
    href: "/tournament",
    howToPlay:
      "Every real-money wager placed during the event window counts toward your total on the live leaderboard. When the countdown ends, standings lock and the top 5 wagerers split the prize pool.",
  },
  {
    id: "viewer-picks",
    name: "Viewer Picks",
    description: "Vote on the next slot in the lineup. Highest vote share plays first.",
    status: "Voting Open",
    participants: 891,
    howToPlay:
      "Every viewer gets one free vote per round, with extra votes purchasable using HellCatCoins. Voting closes 60 seconds before the round starts — highest vote share plays first on stream.",
  },
  {
    id: "coin-flip",
    name: "Coin Flip",
    description: "Double or nothing on your HellCatCoin balance. Coming soon.",
    status: "Coming Soon",
    participants: 0,
    howToPlay: "Wager any amount of HellCatCoins on a live 50/50 flip during stream. Details drop soon.",
  },
  {
    id: "roulette",
    name: "Roulette",
    description: "Community roulette with live betting rounds. Coming soon.",
    status: "Coming Soon",
    participants: 0,
    howToPlay: "Place HellCatCoin bets on community roulette rounds run live on stream. Details drop soon.",
  },
] as const;

export const leaderboard = [
  { rank: 1, username: "AshenOracle", coins: 84210, level: "Cat King" },
  { rank: 2, username: "ObsidianFang", coins: 71980, level: "Mythic Cat" },
  { rank: 3, username: "ToriiWalker", coins: 65330, level: "Mythic Cat" },
  { rank: 4, username: "EmberVirelle", coins: 58120, level: "Alpha Cat" },
  { rank: 5, username: "KitsuneKid", coins: 49760, level: "Alpha Cat" },
] as const;

export const fullLeaderboard = [
  ...leaderboard,
  { rank: 6, username: "CinderWraith", coins: 44380, level: "Alpha Cat" },
  { rank: 7, username: "VeilBornKai", coins: 39710, level: "Alpha Cat" },
  { rank: 8, username: "HexRunnerZo", coins: 35260, level: "Ember Cat" },
  { rank: 9, username: "MoltenIvy", coins: 31840, level: "Ember Cat" },
  { rank: 10, username: "DuskFableRen", coins: 28990, level: "Ember Cat" },
  { rank: 11, username: "GrimshawTix", coins: 26120, level: "Ember Cat" },
  { rank: 12, username: "PyreVantage", coins: 23470, level: "Stray Cat" },
  { rank: 13, username: "NoctisFerra", coins: 21050, level: "Stray Cat" },
  { rank: 14, username: "SableEmbers", coins: 18890, level: "Stray Cat" },
  { rank: 15, username: "QuartzHollow", coins: 16730, level: "Stray Cat" },
  { rank: 16, username: "FeralAmity", coins: 14980, level: "Stray Cat" },
  { rank: 17, username: "ThornKestrel", coins: 13210, level: "Stray Cat" },
  { rank: 18, username: "VulcanDrey", coins: 11540, level: "Stray Cat" },
  { rank: 19, username: "SmolderIkka", coins: 9870, level: "Stray Cat" },
  { rank: 20, username: "RavenAshby", coins: 8120, level: "Stray Cat" },
] as const;

export const leaderboardSeason = {
  name: "Season 4 — The Long Burn",
  endsAt: new Date("2026-08-31T23:59:00-04:00"),
};

export const storePreview = [
  { id: "s1", name: "Bonus Buy Request", price: 2500, category: "Requests", limited: false },
  { id: "s2", name: "VIP Discord Role", price: 8000, category: "Discord", limited: false },
  { id: "s3", name: "Signed Merch Bundle", price: 15000, category: "Merch", limited: true },
  { id: "s4", name: "Event Ticket", price: 6000, category: "Events", limited: true },
] as const;

export const storeCatalog = [
  ...storePreview,
  { id: "s5", name: "Slot Pick Request", price: 1200, category: "Requests", limited: false },
  { id: "s6", name: "Shoutout on Stream", price: 800, category: "Requests", limited: false },
  { id: "s7", name: "Custom Discord Emoji", price: 3200, category: "Discord", limited: false },
  { id: "s8", name: "Discord Nickname Color", price: 1800, category: "Discord", limited: false },
  { id: "s9", name: "Hoodie — Inferno Edition", price: 22000, category: "Merch", limited: true },
  { id: "s10", name: "Sticker Pack", price: 1500, category: "Merch", limited: false },
  { id: "s11", name: "Meet & Greet Pass", price: 40000, category: "Events", limited: true },
  { id: "s12", name: "Giveaway Ticket Bundle x5", price: 4500, category: "Events", limited: false },
] as const;

export const storeCategories = ["All", "Requests", "Discord", "Merch", "Events"] as const;

export const giveawayPreview = {
  title: "$500 Cash Giveaway",
  entriesOpen: true,
  entryCost: 1000,
  freeEntryAvailable: true,
  endsAt: new Date("2026-07-26T19:00:00-04:00"),
  totalEntries: 3120,
};

export const upcomingGiveaways = [
  {
    id: "g2",
    title: "VIP Discord Role Drop",
    entryCost: 400,
    freeEntryAvailable: true,
    startsAt: new Date("2026-07-27T19:00:00-04:00"),
  },
  {
    id: "g3",
    title: "Signed Merch Bundle",
    entryCost: 750,
    freeEntryAvailable: false,
    startsAt: new Date("2026-08-02T19:00:00-04:00"),
  },
];

export const latestWinners = [
  { id: "w1", username: "NightAsh", prize: "$150 Cash", date: "Jul 15" },
  { id: "w2", username: "ForgeQueen", prize: "VIP Discord Role", date: "Jul 12" },
  { id: "w3", username: "RyujinDrift", prize: "Signed Merch", date: "Jul 8" },
];

export const giveawayHistory = [
  ...latestWinners,
  { id: "w4", username: "EmberQuill", prize: "$100 Cash", date: "Jul 4" },
  { id: "w5", username: "ThaneOrrick", prize: "Event Ticket", date: "Jun 29" },
  { id: "w6", username: "MirthaVale", prize: "$250 Cash", date: "Jun 22" },
  { id: "w7", username: "GaleKindred", prize: "Bonus Buy Request", date: "Jun 15" },
];

export const communityHighlights = [
  { id: "h1", username: "SpiritEmber", quote: "The bonus hunt collabs are unmatched. Best community on Kick.", },
  { id: "h2", username: "VolcanicJin", quote: "HellCatCoin store actually has stuff worth grinding for.", },
  { id: "h3", username: "TorchboundLia", quote: "Viewer Picks nights are the highlight of my week.", },
];

