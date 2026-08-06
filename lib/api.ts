export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
export const KICK_CHANNEL_NAME = process.env.NEXT_PUBLIC_KICK_CHANNEL_NAME || "greekgodberry";

export const API_ENDPOINTS = {
  AUTH_DISCORD_INITIATE: `${API_URL}/api/auth/discord/initiate`,
  AUTH_STATUS: `${API_URL}/api/auth/status`,
  AUTH_ME: `${API_URL}/api/auth/me`,
  AUTH_REFRESH: `${API_URL}/api/auth/refresh`,
  AUTH_LOGOUT: `${API_URL}/api/auth/logout`,
  KICK_VERIFY_INITIATE: `${API_URL}/api/auth/kick-verify/initiate`,
  KICK_VERIFY_STATUS: `${API_URL}/api/auth/kick-verify/status`,
  KICK_UNLINK: `${API_URL}/api/auth/kick/unlink`,
  TWITCH_VERIFY_INITIATE: `${API_URL}/api/auth/twitch-verify/initiate`,
  TWITCH_UNLINK: `${API_URL}/api/auth/twitch/unlink`,

  ADMIN_STATS: `${API_URL}/api/admin/stats`,
  ADMIN_AUDIT_LOGS: `${API_URL}/api/admin/audit-logs`,
  ADMIN_USERS: `${API_URL}/api/admin/users`,
  ADMIN_USER: (userId: string) => `${API_URL}/api/admin/users/${userId}`,
  ADMIN_USER_VERIFY_KICK: (userId: string) => `${API_URL}/api/admin/users/${userId}/verify-kick`,
  ADMIN_USER_KICK_USERNAME: (userId: string) => `${API_URL}/api/admin/users/${userId}/kick-username`,
  ADMIN_USER_VERIFY_TWITCH: (userId: string) => `${API_URL}/api/admin/users/${userId}/verify-twitch`,
  ADMIN_USER_TWITCH_USERNAME: (userId: string) => `${API_URL}/api/admin/users/${userId}/twitch-username`,
  ADMIN_USER_COINS: (userId: string) => `${API_URL}/api/admin/users/${userId}/coins`,
  ADMIN_USER_SUSPEND: (userId: string) => `${API_URL}/api/admin/users/${userId}/suspend`,
  ADMIN_USER_MODERATOR: (userId: string) => `${API_URL}/api/admin/users/${userId}/moderator`,

  HUNTS: `${API_URL}/api/hunts`,
  HUNT_LIVE: `${API_URL}/api/hunts/live`,
  HUNT_KNOWN_SLOTS: `${API_URL}/api/hunts/known-slots`,
  HUNT_BY_SLUG: (slug: string) => `${API_URL}/api/hunts/slug/${slug}`,
  HUNT: (id: string) => `${API_URL}/api/hunts/${id}`,
  HUNT_BONUSES: (id: string) => `${API_URL}/api/hunts/${id}/bonuses`,
  HUNT_BONUS: (id: string, bonusId: string) => `${API_URL}/api/hunts/${id}/bonuses/${bonusId}`,
  HUNT_BONUS_OPEN: (id: string, bonusId: string) => `${API_URL}/api/hunts/${id}/bonuses/${bonusId}/open`,
  HUNT_REORDER: (id: string) => `${API_URL}/api/hunts/${id}/reorder`,
  HUNT_SHUFFLE: (id: string) => `${API_URL}/api/hunts/${id}/shuffle`,
  HUNT_START: (id: string) => `${API_URL}/api/hunts/${id}/start`,
  HUNT_COMPLETE: (id: string) => `${API_URL}/api/hunts/${id}/complete`,
  HUNT_GUESSING_OPEN: (id: string) => `${API_URL}/api/hunts/${id}/guessing/open`,
  HUNT_GUESSING_CLOSE: (id: string) => `${API_URL}/api/hunts/${id}/guessing/close`,
  HUNT_SUGGESTIONS: (id: string) => `${API_URL}/api/hunts/${id}/suggestions`,
  HUNT_SUGGESTION: (id: string, suggestionId: string) => `${API_URL}/api/hunts/${id}/suggestions/${suggestionId}`,
  HUNT_SUGGESTION_PROVIDER: (id: string, suggestionId: string) =>
    `${API_URL}/api/hunts/${id}/suggestions/${suggestionId}/provider`,
  HUNT_LIVE_TOGGLE: (id: string) => `${API_URL}/api/hunts/${id}/live`,
  HUNT_GUESS_SUMMARY: (id: string) => `${API_URL}/api/hunts/${id}/guess-summary`,
  HUNT_MY_GUESS: (id: string) => `${API_URL}/api/hunts/${id}/my-guess`,
  HUNT_GUESS: (id: string) => `${API_URL}/api/hunts/${id}/guess`,

  TOURNAMENTS: `${API_URL}/api/tournaments`,
  TOURNAMENT: (id: string) => `${API_URL}/api/tournaments/${id}`,
  TOURNAMENT_MY_ENTRY: (id: string) => `${API_URL}/api/tournaments/${id}/my-entry`,
  TOURNAMENT_ENTER: (id: string) => `${API_URL}/api/tournaments/${id}/enter`,
  TOURNAMENT_SLOT: (id: string) => `${API_URL}/api/tournaments/${id}/slot`,
  TOURNAMENT_ENTRIES: (id: string) => `${API_URL}/api/tournaments/${id}/entries`,
  TOURNAMENT_DRAW: (id: string) => `${API_URL}/api/tournaments/${id}/draw`,
  TOURNAMENT_START: (id: string) => `${API_URL}/api/tournaments/${id}/start`,
  TOURNAMENT_CANCEL: (id: string) => `${API_URL}/api/tournaments/${id}/cancel`,
  TOURNAMENT_OPEN_REGISTRATION: (id: string) => `${API_URL}/api/tournaments/${id}/open-registration`,
  TOURNAMENT_PARTICIPANT_REROLL: (id: string, participantId: string) =>
    `${API_URL}/api/tournaments/${id}/participants/${participantId}/reroll`,
  TOURNAMENT_MATCH_WINNER: (matchId: string) => `${API_URL}/api/tournaments/matches/${matchId}/winner`,

  SITE_CONTENT_ALL: `${API_URL}/api/site-content`,
  SITE_CONTENT: (key: string) => `${API_URL}/api/site-content/${key}`,

  WAGER_LEADERBOARDS: `${API_URL}/api/wager-leaderboard`,
  WAGER_LEADERBOARD_ARCHIVED: `${API_URL}/api/wager-leaderboard/archived`,
  WAGER_LEADERBOARD_LIVE: `${API_URL}/api/wager-leaderboard/live`,
  WAGER_LEADERBOARD: (id: string) => `${API_URL}/api/wager-leaderboard/${id}`,
  WAGER_LEADERBOARD_ENTRIES: (id: string) => `${API_URL}/api/wager-leaderboard/${id}/entries`,
  WAGER_LEADERBOARD_ENTRY: (id: string, entryId: string) => `${API_URL}/api/wager-leaderboard/${id}/entries/${entryId}`,
  WAGER_LEADERBOARD_LIVE_TOGGLE: (id: string) => `${API_URL}/api/wager-leaderboard/${id}/live`,
  WAGER_LEADERBOARD_ARCHIVE: (id: string) => `${API_URL}/api/wager-leaderboard/${id}/archive`,

  GIVEAWAYS: `${API_URL}/api/giveaways`,
  GIVEAWAY: (id: string) => `${API_URL}/api/giveaways/${id}`,
  GIVEAWAY_MY_ENTRY: (id: string) => `${API_URL}/api/giveaways/${id}/my-entry`,
  GIVEAWAY_ENTER: (id: string) => `${API_URL}/api/giveaways/${id}/enter`,
  GIVEAWAY_OPEN: (id: string) => `${API_URL}/api/giveaways/${id}/open`,
  GIVEAWAY_CLOSE: (id: string) => `${API_URL}/api/giveaways/${id}/close`,
  GIVEAWAY_ENTRIES: (id: string) => `${API_URL}/api/giveaways/${id}/entries`,
  GIVEAWAY_ENTRY: (id: string, entryId: string) => `${API_URL}/api/giveaways/${id}/entries/${entryId}`,
  GIVEAWAY_DRAW: (id: string) => `${API_URL}/api/giveaways/${id}/draw`,

  STREAM_GAMES: `${API_URL}/api/stream-games`,
  STREAM_GAMES_ALL: `${API_URL}/api/stream-games/all`,
  STREAM_GAME_BY_SLUG: (slug: string) => `${API_URL}/api/stream-games/slug/${slug}`,
  STREAM_GAME: (id: string) => `${API_URL}/api/stream-games/${id}`,
  STREAM_GAMES_REORDER: `${API_URL}/api/stream-games/reorder`,

  PREDICTION_ACTIVE_MATCH: (slug: string) => `${API_URL}/api/predictions/games/${slug}/active`,
  PREDICTION_MATCHES: (slug: string) => `${API_URL}/api/predictions/games/${slug}/matches`,
  PREDICTION_MATCH: (matchId: string) => `${API_URL}/api/predictions/matches/${matchId}`,
  PREDICTION_MATCH_END: (matchId: string) => `${API_URL}/api/predictions/matches/${matchId}/end`,
  PREDICTION_MATCH_CHALLENGE: (matchId: string) => `${API_URL}/api/predictions/matches/${matchId}/challenge`,
  PREDICTION_ROUNDS: (matchId: string) => `${API_URL}/api/predictions/matches/${matchId}/rounds`,
  PREDICTION_ROUND_LOCK: (roundId: string) => `${API_URL}/api/predictions/rounds/${roundId}/lock`,
  PREDICTION_ROUND_VOID: (roundId: string) => `${API_URL}/api/predictions/rounds/${roundId}/void`,
  PREDICTION_ROUND_RESOLVE: (roundId: string) => `${API_URL}/api/predictions/rounds/${roundId}/resolve`,
  PREDICTION_LEADERBOARD: `${API_URL}/api/predictions/leaderboard`,
  PREDICTION_MY_STATS: `${API_URL}/api/predictions/me/stats`,

  LADDER_LEVELS: `${API_URL}/api/ladder/levels`,
  LADDER_ACTIVE_RUN: (slug: string) => `${API_URL}/api/ladder/games/${slug}/active`,
  LADDER_RUNS: (slug: string) => `${API_URL}/api/ladder/games/${slug}/runs`,
  LADDER_RUN: (runId: string) => `${API_URL}/api/ladder/runs/${runId}`,
  LADDER_RUN_PASS: (runId: string) => `${API_URL}/api/ladder/runs/${runId}/pass`,
  LADDER_RUN_FAIL: (runId: string) => `${API_URL}/api/ladder/runs/${runId}/fail`,
  LADDER_RUN_CASHOUT: (runId: string) => `${API_URL}/api/ladder/runs/${runId}/cashout`,
  LADDER_RUN_CLIMB: (runId: string) => `${API_URL}/api/ladder/runs/${runId}/climb`,

  BINGO_GAMES: (slug: string) => `${API_URL}/api/bingo/games/${slug}`,
  BINGO_ACTIVE_GAME: (slug: string) => `${API_URL}/api/bingo/games/${slug}/active`,
  BINGO_GAME: (id: string) => `${API_URL}/api/bingo/${id}`,
  BINGO_GAME_KEYWORD: (id: string) => `${API_URL}/api/bingo/${id}/keyword`,
  BINGO_GAME_OPEN_REGISTRATION: (id: string) => `${API_URL}/api/bingo/${id}/open-registration`,
  BINGO_GAME_START: (id: string) => `${API_URL}/api/bingo/${id}/start`,
  BINGO_GAME_SPIN: (id: string) => `${API_URL}/api/bingo/${id}/spin-cell`,
  BINGO_GAME_DRAW: (id: string) => `${API_URL}/api/bingo/${id}/draw-player`,
  BINGO_CELL_SLOT: (id: string, cellId: string) => `${API_URL}/api/bingo/${id}/cells/${cellId}/slot`,
  BINGO_GAME_RESULT: (id: string) => `${API_URL}/api/bingo/${id}/result`,
  BINGO_GAME_COMPLETE: (id: string) => `${API_URL}/api/bingo/${id}/complete`,
  BINGO_GAME_UNLIVE: (id: string) => `${API_URL}/api/bingo/${id}/unlive`,
  BINGO_GAME_CANCEL: (id: string) => `${API_URL}/api/bingo/${id}/cancel`,
  BINGO_GAME_PARTICIPANTS: (id: string) => `${API_URL}/api/bingo/${id}/participants`,
  BINGO_GAME_PARTICIPANT: (id: string, chatUsername: string) =>
    `${API_URL}/api/bingo/${id}/participants/${encodeURIComponent(chatUsername)}`,
} as const;

export interface PublicUser {
  id: string;
  discordId: string;
  displayName: string;
  avatarUrl: string | null;
  isAdmin: boolean;
  isModerator: boolean;
  kickUsername: string | null;
  kickVerified: boolean;
  twitchUsername: string | null;
  twitchVerified: boolean;
  catCoinBalance: number;
  totalEarned: number;
  totalSpent: number;
  createdAt: string;
}

export interface AdminUser extends PublicUser {
  isSuspended: boolean;
  lastActiveAt: string;
}

export interface AdminStats {
  totalUsers: number;
  suspendedCount: number;
  adminCount: number;
  moderatorCount: number;
  kickVerifiedCount: number;
  kickPendingCount: number;
  twitchVerifiedCount: number;
  twitchPendingCount: number;
  newUsersLast7Days: number;
  totalCoinsInCirculation: number;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  details: Record<string, unknown> | null;
  createdAt: string;
  admin: { displayName: string; avatarUrl: string | null };
  target: { displayName: string; avatarUrl: string | null } | null;
}

export interface Paginated<T> {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  items: T[];
}

export type HuntStatus = "COLLECTING" | "OPENING" | "COMPLETED";

export interface HuntBonus {
  id: string;
  slotName: string;
  provider: string;
  image: string | null;
  bet: number;
  payout: number | null;
  note: string | null;
  addedAt: string;
}

export interface Hunt {
  id: string;
  slug: string;
  name: string;
  currency: string;
  startBalance: number;
  bonuses: HuntBonus[];
  status: HuntStatus;
  isLive: boolean;
  guessesOpen: boolean;
  guessPrizeCoins: number;
  finalBalance: number | null;
  guessWinnerId: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface HuntGuessWinner {
  displayName: string;
  avatarUrl: string | null;
  guess: number;
}

export interface HuntSlotSuggestion {
  id: string;
  huntId: string;
  slotName: string;
  provider: string;
  chatUsername: string;
  source: "TWITCH" | "KICK";
  createdAt: string;
}

/** A slot name (and last-used provider) pulled from past hunts, for admin autocomplete. */
export interface KnownSlot {
  slotName: string;
  provider: string;
}

/** Keep in sync with PROVIDER_ALIASES canonical names in
 * backend/src/services/HuntChatCommands.ts. */
export const SLOT_PROVIDERS = [
  "Pragmatic Play",
  "Nolimit City",
  "Hacksaw Gaming",
  "Big Time Gaming",
  "Play'n GO",
  "Push Gaming",
  "Relax Gaming",
  "Red Tiger",
  "Blueprint Gaming",
  "ELK Studios",
  "Quickspin",
  "NetEnt",
  "Playtech",
  "Thunderkick",
  "Other",
] as const;

// ---------- Giveaways (real raffle entries) ----------

export type GiveawayStatus = "DRAFT" | "OPEN" | "CLOSED" | "COMPLETED";

export interface GiveawayUserRef {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface Giveaway {
  id: string;
  title: string;
  description: string | null;
  entryCost: number;
  requirementText: string | null;
  status: GiveawayStatus;
  endsAt: string | null;
  winnerId: string | null;
  winner: GiveawayUserRef | null;
  createdById: string;
  createdBy: GiveawayUserRef;
  _count: { entries: number };
  createdAt: string;
  updatedAt: string;
  drawnAt: string | null;
}

export interface GiveawayEntry {
  id: string;
  giveawayId: string;
  userId: string;
  addedByAdmin: boolean;
  enteredAt: string;
  user: GiveawayUserRef;
}

export type TournamentStatus = "DRAFT" | "REGISTRATION" | "SLOT_SELECTION" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type MatchStatus = "PENDING" | "ACTIVE" | "COMPLETED";

export interface TournamentUserRef {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface TournamentEntry {
  id: string;
  tournamentId: string;
  userId: string;
  enteredAt: string;
  user: TournamentUserRef;
}

export interface TournamentParticipant {
  id: string;
  tournamentId: string;
  userId: string;
  seed: number | null;
  slotCall: string | null;
  slotConfirmed: boolean;
  slotDeadline: string | null;
  eliminated: boolean;
  finalPosition: number | null;
  user: TournamentUserRef;
}

export interface TournamentMatch {
  id: string;
  tournamentId: string;
  round: number;
  matchNumber: number;
  status: MatchStatus;
  participantAId: string | null;
  participantBId: string | null;
  winnerId: string | null;
  nextMatchId: string | null;
}

export interface Tournament {
  id: string;
  title: string;
  status: TournamentStatus;
  maxPlayers: number;
  slotTimerSeconds: number;
  prizeCoins: number;
  currentRound: number;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface FullTournament extends Tournament {
  entries: TournamentEntry[];
  participants: TournamentParticipant[];
  matches: TournamentMatch[];
}

// ---------- Admin-editable site content ----------

export interface StreamStatusContent {
  isLive: boolean;
  title: string;
  category: string;
  viewers: number;
  uptimeMinutes: number;
}

export interface HeroHighlight {
  label: string;
  value: string;
}

export interface CommunityStat {
  label: string;
  value: number;
}

export interface AnnouncementContent {
  id: string;
  title: string;
  body: string;
  date: string;
  pinned?: boolean;
}

export interface StoreItemContent {
  id: string;
  name: string;
  price: number;
  category: string;
  limited: boolean;
}

export interface CommunityHighlightContent {
  id: string;
  username: string;
  quote: string;
}

export interface GameContent {
  id: string;
  name: string;
  description: string;
  status: string;
  participants: number;
  href?: string;
  howToPlay?: string;
}

export interface WagerEntry {
  id: string;
  name: string;
  wagered: number;
  avatarUrl: string | null;
}

export interface WagerPrizeTier {
  rank: number;
  amount: number;
}

export interface WagerWinner {
  rank: number;
  name: string;
  avatarUrl: string | null;
  wagered: number;
  prizeAmount: number;
}

export interface WagerLeaderboard {
  id: string;
  title: string | null;
  prizeAmount: number;
  currency: string;
  /** Explicit title if set, else auto-generated, e.g. "$250 Leaderboard". */
  displayTitle: string;
  /** Sorted highest wagered first. */
  entries: WagerEntry[];
  isLive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  /** Per-rank payout; null means winner-takes-all of prizeAmount. */
  prizeDistribution: WagerPrizeTier[] | null;
  archivedAt: string | null;
  winners: WagerWinner[];
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

// ---------- Stream games: catalog + Chat vs Streamer ----------

export interface StreamGame {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  isVisible: boolean;
  /** Real, moment-to-moment "is a match/run/hunt/tournament actually
   * happening right now" — only present on the catalog list endpoints, not
   * getBySlug. Distinct from isActive, which just means "shown in the
   * catalog at all". */
  isLive?: boolean;
  sortOrder: number;
  prizeModeEnabled: boolean;
  prizeRulesText: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export type PredictionChoice = "CHAT" | "STREAMER";
export type PredictionMatchFormat = "SHORT" | "NORMAL" | "EVENT";
export type PredictionMatchStatus = "ACTIVE" | "COMPLETED";
export type PredictionRoundStatus = "OPEN" | "LOCKED" | "RESOLVED" | "VOID";

export interface PredictionRound {
  id: string;
  matchId: string;
  roundNumber: number;
  question: string;
  streamerCall: string;
  status: PredictionRoundStatus;
  votesChat: number;
  votesStreamer: number;
  chatPick: PredictionChoice | null;
  streamerCorrect: boolean | null;
  openedAt: string | null;
  lockedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface PredictionMatch {
  id: string;
  streamGameId: string;
  format: PredictionMatchFormat;
  targetScore: number;
  status: PredictionMatchStatus;
  chatScore: number;
  streamerScore: number;
  chatStreak: number;
  streamerStreak: number;
  chatUnderdog: boolean;
  streamerUnderdog: boolean;
  winner: PredictionChoice | null;
  challengeText: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  rounds: PredictionRound[];
  streamGame: { id: string; slug: string; name: string };
}

export interface PredictionLeaderboardEntry {
  user: { id: string; displayName: string; avatarUrl: string | null };
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
}

export interface PredictionUserStats {
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  longestStreak: number;
}

// ---------- Climb the Ladder ----------

export interface LadderLevel {
  level: number;
  points: number;
  label: string;
  net: number | null;
}

export type LadderRunStatus = "ACTIVE" | "CASHED_OUT" | "FAILED" | "COMPLETED";
export type LadderRunPhase = "ATTEMPTING" | "DECISION";

export interface LadderRun {
  id: string;
  streamGameId: string;
  participantName: string;
  status: LadderRunStatus;
  phase: LadderRunPhase;
  currentLevel: number;
  securedFloor: number;
  finalPoints: number | null;
  chatPassVotes: number;
  chatFailVotes: number;
  chatCashoutVotes: number;
  chatClimbVotes: number;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  endedAt: string | null;
}

// ---------- Bonus Bingo ----------

export type BingoStatus = "DRAFT" | "REGISTRATION" | "ACTIVE" | "COMPLETED" | "CANCELLED";
export type BingoCellStatus = "EMPTY" | "ACTIVE" | "GREEN";

export interface BingoUserRef {
  id: string;
  displayName: string;
  kickUsername: string | null;
  avatarUrl: string | null;
}

export interface BingoCell {
  id: string;
  gameId: string;
  row: number;
  col: number;
  status: BingoCellStatus;
  slotName: string | null;
  claimedByChatUsername: string | null;
  claimedByUserId: string | null;
  claimedAt: string | null;
  claimedBy: BingoUserRef | null;
}

export interface BingoParticipant {
  id: string;
  gameId: string;
  chatUsername: string;
  userId: string | null;
  preferredSlot: string | null;
  joinedAt: string;
  user: BingoUserRef | null;
}

export interface BingoLineWin {
  id: string;
  gameId: string;
  lineType: "row" | "col" | "diag";
  lineIndex: number;
  pointsEach: number;
  winners: string[];
  completedAt: string;
}

export interface BingoGame {
  id: string;
  streamGameId: string;
  title: string;
  keyword: string;
  gridSize: number;
  linePoints: number;
  status: BingoStatus;
  currentCellId: string | null;
  currentChatUsername: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  cells: BingoCell[];
  participants: BingoParticipant[];
  lineWins: BingoLineWin[];
}
