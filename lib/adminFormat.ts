const ACTION_LABELS: Record<string, string> = {
  "kick.verify": "Verified Kick account",
  "kick.unverify": "Unverified Kick account",
  "kick.edit_username": "Edited Kick username",
  "coins.adjust": "Adjusted HellCatCoin balance",
  "user.suspend": "Suspended user",
  "user.unsuspend": "Unsuspended user",
  "user.grant_moderator": "Granted Moderator role",
  "user.revoke_moderator": "Revoked Moderator role",
};

export function formatAuditAction(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
