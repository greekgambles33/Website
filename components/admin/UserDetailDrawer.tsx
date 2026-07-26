"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Loader2,
  ShieldCheck,
  ShieldOff,
  ShieldAlert,
  Coins,
  Link2,
  Check,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/providers/AuthProvider";
import type { AdminUser } from "@/lib/api";
import {
  fetchAdminUser,
  adjustUserCoins,
  setUserSuspended,
  setUserModerator,
  verifyUserKick,
  editUserKickUsername,
  verifyUserTwitch,
  editUserTwitchUsername,
  AdminApiError,
} from "@/lib/adminApi";

function Feedback({ message }: { message: { type: "success" | "error"; text: string } | null }) {
  if (!message) return null;
  return (
    <p className={`mt-2 text-xs ${message.type === "success" ? "text-lava-300" : "text-crimson-400"}`}>
      {message.text}
    </p>
  );
}

export function UserDetailDrawer({
  userId,
  onClose,
  onChanged,
}: {
  userId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [kickUsernameInput, setKickUsernameInput] = useState("");
  const [savingKick, setSavingKick] = useState(false);
  const [kickFeedback, setKickFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [twitchUsernameInput, setTwitchUsernameInput] = useState("");
  const [savingTwitch, setSavingTwitch] = useState(false);
  const [twitchFeedback, setTwitchFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [coinAmount, setCoinAmount] = useState("");
  const [coinReason, setCoinReason] = useState("");
  const [savingCoins, setSavingCoins] = useState(false);
  const [coinFeedback, setCoinFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [savingModerator, setSavingModerator] = useState(false);
  const [savingSuspend, setSavingSuspend] = useState(false);
  const [suspendConfirming, setSuspendConfirming] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSelf = currentUser?.id === userId;

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const u = await fetchAdminUser(userId);
      setUser(u);
      setKickUsernameInput(u.kickUsername ?? "");
      setTwitchUsernameInput(u.twitchUsername ?? "");
    } catch (err) {
      setLoadError(err instanceof AdminApiError ? err.message : "Failed to load user");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    return () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleSaveKick = async () => {
    setSavingKick(true);
    setKickFeedback(null);
    try {
      await editUserKickUsername(userId, kickUsernameInput.trim() || null);
      setKickFeedback({ type: "success", text: "Kick username updated." });
      await load();
      onChanged();
    } catch (err) {
      setKickFeedback({ type: "error", text: err instanceof AdminApiError ? err.message : "Failed to update" });
    } finally {
      setSavingKick(false);
    }
  };

  const handleToggleKickVerified = async () => {
    if (!user) return;
    setSavingKick(true);
    setKickFeedback(null);
    try {
      await verifyUserKick(userId, !user.kickVerified);
      await load();
      onChanged();
    } catch (err) {
      setKickFeedback({ type: "error", text: err instanceof AdminApiError ? err.message : "Failed to update" });
    } finally {
      setSavingKick(false);
    }
  };

  const handleSaveTwitch = async () => {
    setSavingTwitch(true);
    setTwitchFeedback(null);
    try {
      await editUserTwitchUsername(userId, twitchUsernameInput.trim() || null);
      setTwitchFeedback({ type: "success", text: "Twitch username updated." });
      await load();
      onChanged();
    } catch (err) {
      setTwitchFeedback({ type: "error", text: err instanceof AdminApiError ? err.message : "Failed to update" });
    } finally {
      setSavingTwitch(false);
    }
  };

  const handleToggleTwitchVerified = async () => {
    if (!user) return;
    setSavingTwitch(true);
    setTwitchFeedback(null);
    try {
      await verifyUserTwitch(userId, !user.twitchVerified);
      await load();
      onChanged();
    } catch (err) {
      setTwitchFeedback({ type: "error", text: err instanceof AdminApiError ? err.message : "Failed to update" });
    } finally {
      setSavingTwitch(false);
    }
  };

  const handleAdjustCoins = async () => {
    const amount = Number.parseInt(coinAmount, 10);
    if (!Number.isInteger(amount) || amount === 0) {
      setCoinFeedback({ type: "error", text: "Enter a non-zero whole number." });
      return;
    }
    setSavingCoins(true);
    setCoinFeedback(null);
    try {
      await adjustUserCoins(userId, amount, coinReason.trim());
      setCoinFeedback({ type: "success", text: `Balance ${amount > 0 ? "credited" : "debited"} successfully.` });
      setCoinAmount("");
      setCoinReason("");
      await load();
      onChanged();
    } catch (err) {
      setCoinFeedback({ type: "error", text: err instanceof AdminApiError ? err.message : "Failed to adjust coins" });
    } finally {
      setSavingCoins(false);
    }
  };

  const handleToggleModerator = async () => {
    if (!user) return;
    setSavingModerator(true);
    try {
      await setUserModerator(userId, !user.isModerator);
      await load();
      onChanged();
    } catch {
      // surfaced via reload failing silently is unlikely; keep UI simple
    } finally {
      setSavingModerator(false);
    }
  };

  const handleSuspendClick = async () => {
    if (!user) return;
    // Only the destructive "Suspend" action needs a confirm step — lifting a
    // suspension should never require a second click.
    if (!user.isSuspended && !suspendConfirming) {
      setSuspendConfirming(true);
      confirmTimer.current = setTimeout(() => setSuspendConfirming(false), 3000);
      return;
    }
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    setSuspendConfirming(false);
    setSavingSuspend(true);
    try {
      await setUserSuspended(userId, !user.isSuspended);
      await load();
      onChanged();
    } finally {
      setSavingSuspend(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        key="drawer"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="glass-panel fixed inset-y-0 right-0 z-[70] w-full max-w-md overflow-y-auto border-l border-lava-400/20 p-6"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full p-2 text-ash-300 hover:bg-white/5 hover:text-white"
        >
          <X size={18} />
        </button>

        {loading ? (
          <div className="flex h-full min-h-[300px] items-center justify-center">
            <Loader2 size={24} className="animate-spin text-lava-400" />
          </div>
        ) : loadError || !user ? (
          <p className="mt-10 text-sm text-crimson-400">{loadError ?? "User not found"}</p>
        ) : (
          <div className="mt-2 space-y-7">
            <div className="flex items-center gap-3 pr-8">
              {user.avatarUrl ? (
                <Image src={user.avatarUrl} alt={user.displayName} width={52} height={52} className="rounded-full" />
              ) : (
                <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-crimson-600 text-lg font-bold text-white">
                  {user.displayName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-white">{user.displayName}</h2>
                <p className="truncate text-xs text-ash-500">{user.discordId}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {user.isAdmin && <Badge tone="gold">Admin</Badge>}
              {user.isModerator && <Badge tone="lava">Moderator</Badge>}
              {user.isSuspended && <Badge tone="live">Suspended</Badge>}
              {isSelf && <Badge tone="neutral">This is you</Badge>}
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl border border-white/5 bg-white/[0.02] py-3">
                <p className="text-ember text-lg font-bold">{user.catCoinBalance.toLocaleString()}</p>
                <p className="mt-1 text-[10px] uppercase tracking-widest text-ash-500">Balance</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.02] py-3">
                <p className="text-lg font-bold text-white">{user.totalEarned.toLocaleString()}</p>
                <p className="mt-1 text-[10px] uppercase tracking-widest text-ash-500">Earned</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.02] py-3">
                <p className="text-lg font-bold text-white">{user.totalSpent.toLocaleString()}</p>
                <p className="mt-1 text-[10px] uppercase tracking-widest text-ash-500">Spent</p>
              </div>
            </div>

            {/* Kick section */}
            <div className="border-t border-white/5 pt-6">
              <div className="flex items-center gap-2">
                <Link2 size={15} className="text-lava-400" />
                <h3 className="text-sm font-semibold text-white">Kick Account</h3>
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={kickUsernameInput}
                  onChange={(e) => setKickUsernameInput(e.target.value)}
                  placeholder="Kick username"
                  className="min-w-0 flex-1 rounded-lg border border-white/10 bg-ash-900/60 px-3 py-2 text-sm text-white placeholder:text-ash-500 focus:border-lava-500/50 focus:outline-none"
                />
                <Button size="sm" variant="secondary" disabled={savingKick} onClick={handleSaveKick}>
                  Save
                </Button>
              </div>
              {user.kickUsername && (
                <button
                  disabled={savingKick}
                  onClick={handleToggleKickVerified}
                  className="mt-3 flex items-center gap-2 text-xs font-semibold text-ash-300 hover:text-white disabled:opacity-50"
                >
                  {user.kickVerified ? (
                    <>
                      <ShieldOff size={14} className="text-ash-400" /> Unverify
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={14} className="text-lava-400" /> Mark Verified
                    </>
                  )}
                </button>
              )}
              <Feedback message={kickFeedback} />
            </div>

            {/* Twitch section */}
            <div className="border-t border-white/5 pt-6">
              <div className="flex items-center gap-2">
                <Link2 size={15} className="text-lava-400" />
                <h3 className="text-sm font-semibold text-white">Twitch Account</h3>
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={twitchUsernameInput}
                  onChange={(e) => setTwitchUsernameInput(e.target.value)}
                  placeholder="Twitch username"
                  className="min-w-0 flex-1 rounded-lg border border-white/10 bg-ash-900/60 px-3 py-2 text-sm text-white placeholder:text-ash-500 focus:border-lava-500/50 focus:outline-none"
                />
                <Button size="sm" variant="secondary" disabled={savingTwitch} onClick={handleSaveTwitch}>
                  Save
                </Button>
              </div>
              {user.twitchUsername && (
                <button
                  disabled={savingTwitch}
                  onClick={handleToggleTwitchVerified}
                  className="mt-3 flex items-center gap-2 text-xs font-semibold text-ash-300 hover:text-white disabled:opacity-50"
                >
                  {user.twitchVerified ? (
                    <>
                      <ShieldOff size={14} className="text-ash-400" /> Unverify
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={14} className="text-lava-400" /> Mark Verified
                    </>
                  )}
                </button>
              )}
              <Feedback message={twitchFeedback} />
            </div>

            {/* Coins section */}
            <div className="border-t border-white/5 pt-6">
              <div className="flex items-center gap-2">
                <Coins size={15} className="text-gold-400" />
                <h3 className="text-sm font-semibold text-white">Adjust Balance</h3>
              </div>
              <p className="mt-1 text-xs text-ash-400">Positive to credit, negative to debit.</p>
              <div className="mt-3 flex gap-2">
                <input
                  value={coinAmount}
                  onChange={(e) => setCoinAmount(e.target.value)}
                  placeholder="e.g. 500 or -200"
                  inputMode="numeric"
                  className="w-32 rounded-lg border border-white/10 bg-ash-900/60 px-3 py-2 text-sm text-white placeholder:text-ash-500 focus:border-lava-500/50 focus:outline-none"
                />
                <input
                  value={coinReason}
                  onChange={(e) => setCoinReason(e.target.value)}
                  placeholder="Reason (optional)"
                  className="min-w-0 flex-1 rounded-lg border border-white/10 bg-ash-900/60 px-3 py-2 text-sm text-white placeholder:text-ash-500 focus:border-lava-500/50 focus:outline-none"
                />
              </div>
              <Button
                size="sm"
                className="mt-3"
                disabled={savingCoins || isSelf}
                onClick={handleAdjustCoins}
              >
                {savingCoins ? "Saving…" : "Apply Adjustment"}
              </Button>
              {isSelf && <p className="mt-2 text-xs text-ash-500">You can&apos;t adjust your own balance.</p>}
              <Feedback message={coinFeedback} />
            </div>

            {/* Roles section */}
            <div className="border-t border-white/5 pt-6">
              <h3 className="text-sm font-semibold text-white">Moderator Role</h3>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-ash-300">
                  {user.isModerator ? "Currently a moderator" : "Not a moderator"}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={savingModerator || isSelf}
                  onClick={handleToggleModerator}
                >
                  {user.isModerator ? "Revoke" : "Grant"}
                </Button>
              </div>
              {isSelf && <p className="mt-2 text-xs text-ash-500">You can&apos;t change your own roles.</p>}
              {user.isAdmin && (
                <p className="mt-3 flex items-start gap-1.5 text-xs text-ash-500">
                  <ShieldAlert size={13} className="mt-0.5 shrink-0" />
                  Admin access is controlled by the ADMIN_DISCORD_IDS server config, not editable here.
                </p>
              )}
            </div>

            {/* Suspend section */}
            <div className="border-t border-white/5 pt-6 pb-2">
              <h3 className="text-sm font-semibold text-white">Account Status</h3>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-ash-300">
                  {user.isSuspended ? "This account is suspended" : "This account is in good standing"}
                </span>
                <Button
                  size="sm"
                  variant={user.isSuspended ? "secondary" : "primary"}
                  className={user.isSuspended ? "" : "from-crimson-500 to-crimson-600 shadow-[0_10px_30px_rgba(220,30,10,0.4)]"}
                  disabled={savingSuspend || isSelf}
                  onClick={handleSuspendClick}
                >
                  {savingSuspend ? (
                    "Saving…"
                  ) : suspendConfirming ? (
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle size={13} /> Confirm?
                    </span>
                  ) : user.isSuspended ? (
                    <span className="flex items-center gap-1.5">
                      <Check size={13} /> Unsuspend
                    </span>
                  ) : (
                    "Suspend"
                  )}
                </Button>
              </div>
              {isSelf && <p className="mt-2 text-xs text-ash-500">You can&apos;t suspend your own account.</p>}
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
