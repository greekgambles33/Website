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

  ADMIN_STATS: `${API_URL}/api/admin/stats`,
  ADMIN_AUDIT_LOGS: `${API_URL}/api/admin/audit-logs`,
  ADMIN_USERS: `${API_URL}/api/admin/users`,
  ADMIN_USER: (userId: string) => `${API_URL}/api/admin/users/${userId}`,
  ADMIN_USER_VERIFY_KICK: (userId: string) => `${API_URL}/api/admin/users/${userId}/verify-kick`,
  ADMIN_USER_KICK_USERNAME: (userId: string) => `${API_URL}/api/admin/users/${userId}/kick-username`,
  ADMIN_USER_COINS: (userId: string) => `${API_URL}/api/admin/users/${userId}/coins`,
  ADMIN_USER_SUSPEND: (userId: string) => `${API_URL}/api/admin/users/${userId}/suspend`,
  ADMIN_USER_MODERATOR: (userId: string) => `${API_URL}/api/admin/users/${userId}/moderator`,

  HUNTS: `${API_URL}/api/hunts`,
  HUNT_LIVE: `${API_URL}/api/hunts/live`,
  HUNT_BY_SLUG: (slug: string) => `${API_URL}/api/hunts/slug/${slug}`,
  HUNT: (id: string) => `${API_URL}/api/hunts/${id}`,
  HUNT_BONUSES: (id: string) => `${API_URL}/api/hunts/${id}/bonuses`,
  HUNT_BONUS: (id: string, bonusId: string) => `${API_URL}/api/hunts/${id}/bonuses/${bonusId}`,
  HUNT_BONUS_OPEN: (id: string, bonusId: string) => `${API_URL}/api/hunts/${id}/bonuses/${bonusId}/open`,
  HUNT_REORDER: (id: string) => `${API_URL}/api/hunts/${id}/reorder`,
  HUNT_SHUFFLE: (id: string) => `${API_URL}/api/hunts/${id}/shuffle`,
  HUNT_START: (id: string) => `${API_URL}/api/hunts/${id}/start`,
  HUNT_COMPLETE: (id: string) => `${API_URL}/api/hunts/${id}/complete`,
  HUNT_LIVE_TOGGLE: (id: string) => `${API_URL}/api/hunts/${id}/live`,

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
  createdById: string;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
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
