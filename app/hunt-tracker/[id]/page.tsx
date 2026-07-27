"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Plus,
  Trash2,
  Pencil,
  Shuffle,
  Play,
  CheckCircle2,
  Radio,
  RadioTower,
  Copy,
  ExternalLink,
  ArrowLeft,
  Crown,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/components/providers/AuthProvider";
import { formatCurrency, cn } from "@/lib/utils";
import { calcHuntStats, bonusMultiplier } from "@/lib/huntStats";
import {
  fetchHunt,
  addBonus,
  editBonus,
  removeBonus,
  openBonus,
  shuffleBonuses,
  startHunt,
  completeHunt,
  goLive,
  takeDown,
  deleteHunt,
  HuntApiError,
} from "@/lib/huntsApi";
import type { Hunt, HuntBonus } from "@/lib/api";

const statusTone = { COLLECTING: "neutral", OPENING: "live", COMPLETED: "gold" } as const;

export default function HuntBuilderPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [hunt, setHunt] = useState<Hunt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [showAddBonus, setShowAddBonus] = useState(false);
  const [editingBonus, setEditingBonus] = useState<HuntBonus | null>(null);
  const [openingBonus, setOpeningBonus] = useState<HuntBonus | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchHunt(params.id);
      setHunt(data);
      setError(null);
    } catch (err) {
      setError(err instanceof HuntApiError ? err.message : "Hunt not found");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  const runAction = async (action: () => Promise<Hunt>) => {
    setBusy(true);
    try {
      const updated = await action();
      setHunt(updated);
    } catch (err) {
      alert(err instanceof HuntApiError ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteHunt = async () => {
    if (!hunt || !confirm(`Delete "${hunt.name}" permanently? This cannot be undone.`)) return;
    try {
      await deleteHunt(hunt.id);
      router.push("/hunt-tracker");
    } catch (err) {
      alert(err instanceof HuntApiError ? err.message : "Failed to delete hunt");
    }
  };

  const copyWidgetUrl = () => {
    const url = `${window.location.origin}/bonus-hunt-widget`;
    navigator.clipboard.writeText(url);
    alert("OBS widget URL copied to clipboard");
  };

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 size={24} className="animate-spin text-lava-400" />
      </div>
    );
  }

  if (error || !hunt) {
    return (
      <GlassCard className="py-14 text-center">
        <p className="text-sm text-crimson-400">{error ?? "Hunt not found"}</p>
        <Link
          href="/hunt-tracker"
          className="font-heading mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-lava-300 hover:text-white"
        >
          <ArrowLeft size={14} /> Back to Hunt Tracker
        </Link>
      </GlassCard>
    );
  }

  const stats = calcHuntStats(hunt);
  const bestMulti = stats.bestSpin ? bonusMultiplier(stats.bestSpin) : null;
  const canManageLive = !!user?.isAdmin;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/hunt-tracker"
            className="font-heading flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-ash-400 hover:text-white"
          >
            <ArrowLeft size={12} /> All Hunts
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <h2 className="text-xl font-semibold text-white">{hunt.name}</h2>
            <Badge tone={statusTone[hunt.status]} pulse={hunt.status === "OPENING"}>
              {hunt.status}
            </Badge>
            {hunt.isLive && (
              <Badge tone="live" pulse className="gap-1">
                <Radio size={10} /> Live
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={copyWidgetUrl}
            className="font-heading flex items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-2 text-xs font-semibold uppercase tracking-wide text-ash-300 hover:text-white"
          >
            <Copy size={13} /> OBS Widget
          </button>
          <Link
            href={`/bonus-hunt/${hunt.slug}`}
            target="_blank"
            className="font-heading flex items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-2 text-xs font-semibold uppercase tracking-wide text-ash-300 hover:text-white"
          >
            <ExternalLink size={13} /> Public Page
          </Link>

          {hunt.status === "COLLECTING" && (
            <button
              disabled={busy || hunt.bonuses.length === 0}
              onClick={() => runAction(() => startHunt(hunt.id))}
              className="font-heading flex items-center gap-1.5 rounded-[10px] bg-gradient-to-b from-lava-300 to-lava-400 px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#140a04] disabled:opacity-50"
            >
              <Play size={13} /> Start Hunt
            </button>
          )}
          {hunt.status !== "COMPLETED" && (
            <button
              disabled={busy}
              onClick={() => {
                if (!confirm("End this hunt? This cannot be undone.")) return;
                const raw = prompt("Final balance (leave blank to skip settling Guess the Balance):");
                if (raw === null) return;
                const finalBalance = raw.trim() === "" ? undefined : Number(raw);
                if (finalBalance !== undefined && (!Number.isFinite(finalBalance) || finalBalance < 0)) {
                  alert("Final balance must be a non-negative number");
                  return;
                }
                runAction(() => completeHunt(hunt.id, finalBalance));
              }}
              className="font-heading flex items-center gap-1.5 rounded-[10px] border border-gold-400/40 px-4 py-2 text-xs font-bold uppercase tracking-wide text-gold-400 disabled:opacity-50"
            >
              <CheckCircle2 size={13} /> End Hunt
            </button>
          )}

          {canManageLive &&
            (hunt.isLive ? (
              <button
                disabled={busy}
                onClick={() => runAction(() => takeDown(hunt.id))}
                className="font-heading flex items-center gap-1.5 rounded-[10px] bg-crimson-500 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white disabled:opacity-50"
              >
                <RadioTower size={13} /> Take Down
              </button>
            ) : (
              <button
                disabled={busy || hunt.status === "COMPLETED"}
                onClick={() => runAction(() => goLive(hunt.id))}
                className="font-heading flex items-center gap-1.5 rounded-[10px] bg-crimson-500/90 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white disabled:opacity-50"
              >
                <RadioTower size={13} /> Go Live
              </button>
            ))}

          <button
            onClick={handleDeleteHunt}
            aria-label="Delete hunt"
            className="rounded-full p-2 text-ash-500 hover:bg-crimson-500/10 hover:text-crimson-300"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <MiniStat label="Bonuses" value={String(stats.totalBonuses)} />
        <MiniStat label="Start" value={formatCurrency(hunt.startBalance, hunt.currency)} />
        <MiniStat label="Winnings" value={formatCurrency(stats.winnings, hunt.currency)} />
        <MiniStat
          label="Profit / Loss"
          value={stats.opened.length > 0 ? formatCurrency(stats.profitLoss, hunt.currency) : "—"}
          color={stats.profitLoss >= 0 ? "#7ad07a" : undefined}
        />
        <MiniStat label="Best Multi" value={bestMulti !== null ? `${bestMulti.toFixed(2)}x` : "—"} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddBonus(true)}
            className="font-heading flex items-center gap-1.5 rounded-[10px] bg-gradient-to-b from-lava-300 to-lava-400 px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#140a04]"
          >
            <Plus size={14} /> Add Bonus
          </button>
          <button
            disabled={busy || hunt.bonuses.length < 2}
            onClick={() => runAction(() => shuffleBonuses(hunt.id))}
            className="font-heading flex items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-2 text-xs font-semibold uppercase tracking-wide text-ash-300 disabled:opacity-40 hover:text-white"
          >
            <Shuffle size={13} /> Shuffle
          </button>
        </div>
        <p className="text-xs text-ash-500">
          {stats.opened.length} opened &middot; {stats.pending} pending
        </p>
      </div>

      <GlassCard className="p-0">
        {hunt.bonuses.length === 0 ? (
          <p className="p-8 text-center text-sm text-ash-400">No bonuses yet — add the first one to get started.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 text-xs uppercase tracking-widest text-ash-500">
                  <th className="px-5 py-3 font-semibold">Slot</th>
                  <th className="px-5 py-3 font-semibold">Provider</th>
                  <th className="px-5 py-3 font-semibold">Bet</th>
                  <th className="px-5 py-3 font-semibold">Payout</th>
                  <th className="px-5 py-3 font-semibold">Multi</th>
                  <th className="px-5 py-3 font-semibold" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {hunt.bonuses.map((bonus) => {
                  const multi = bonusMultiplier(bonus);
                  const isBest = stats.bestSpin?.id === bonus.id;
                  return (
                    <tr key={bonus.id} className="hover:bg-white/[0.03]">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{bonus.slotName}</span>
                          {isBest && <Crown size={13} className="text-gold-400" />}
                        </div>
                        {bonus.note && <p className="mt-0.5 text-xs text-ash-500">{bonus.note}</p>}
                      </td>
                      <td className="px-5 py-3 text-ash-300">{bonus.provider}</td>
                      <td className="px-5 py-3 text-ash-300">{formatCurrency(bonus.bet, hunt.currency)}</td>
                      <td className="px-5 py-3">
                        {bonus.payout !== null ? (
                          <span className="font-semibold text-lava-300">
                            {formatCurrency(bonus.payout, hunt.currency)}
                          </span>
                        ) : (
                          <span className="text-ash-600">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {multi !== null ? (
                          <span
                            className={cn(
                              "font-semibold",
                              multi >= stats.requiredAvgPerBonus / (bonus.bet || 1) ? "text-[#7ad07a]" : "text-crimson-400"
                            )}
                          >
                            {multi.toFixed(2)}x
                          </span>
                        ) : (
                          <span className="text-ash-600">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {bonus.payout === null && (
                            <button
                              onClick={() => setOpeningBonus(bonus)}
                              className="font-heading rounded-full border border-lava-400/40 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-lava-300 hover:bg-lava-500/10"
                            >
                              Open
                            </button>
                          )}
                          <button
                            onClick={() => setEditingBonus(bonus)}
                            aria-label="Edit bonus"
                            className="rounded-full p-1.5 text-ash-500 hover:bg-white/5 hover:text-white"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => runAction(() => removeBonus(hunt.id, bonus.id))}
                            aria-label="Remove bonus"
                            className="rounded-full p-1.5 text-ash-500 hover:bg-crimson-500/10 hover:text-crimson-300"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {showAddBonus && (
        <BonusModal
          title="Add Bonus"
          onClose={() => setShowAddBonus(false)}
          onSubmit={async (data) => {
            const updated = await addBonus(hunt.id, data);
            setHunt(updated);
            setShowAddBonus(false);
          }}
        />
      )}

      {editingBonus && (
        <BonusModal
          title="Edit Bonus"
          initial={editingBonus}
          onClose={() => setEditingBonus(null)}
          onSubmit={async (data) => {
            const updated = await editBonus(hunt.id, editingBonus.id, data);
            setHunt(updated);
            setEditingBonus(null);
          }}
        />
      )}

      {openingBonus && (
        <OpenBonusModal
          bonus={openingBonus}
          currency={hunt.currency}
          onClose={() => setOpeningBonus(null)}
          onSubmit={async (payout) => {
            const updated = await openBonus(hunt.id, openingBonus.id, payout);
            setHunt(updated);
            setOpeningBonus(null);
          }}
        />
      )}
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <GlassCard className="text-center">
      <div className="font-display text-xl sm:text-2xl" style={color ? { color } : undefined}>
        <span className={color ? "" : "text-coin"}>{value}</span>
      </div>
      <p className="font-heading mt-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ash-300">
        {label}
      </p>
    </GlassCard>
  );
}

function BonusModal({
  title,
  initial,
  onClose,
  onSubmit,
}: {
  title: string;
  initial?: HuntBonus;
  onClose: () => void;
  onSubmit: (data: { slotName: string; provider: string; image: string | null; bet: number; note: string | null }) => Promise<void>;
}) {
  const [slotName, setSlotName] = useState(initial?.slotName ?? "");
  const [provider, setProvider] = useState(initial?.provider ?? "");
  const [image, setImage] = useState(initial?.image ?? "");
  const [bet, setBet] = useState(initial?.bet ? String(initial.bet) : "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const betNum = Number(bet);
    if (!slotName.trim()) return setError("Slot name is required");
    if (!Number.isFinite(betNum) || betNum <= 0) return setError("Enter a valid bet size");

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        slotName: slotName.trim(),
        provider: provider.trim() || "Unknown",
        image: image.trim() || null,
        bet: betNum,
        note: note.trim() || null,
      });
    } catch (err) {
      setError(err instanceof HuntApiError ? err.message : "Failed to save bonus");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <GlassCard className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <Field label="Slot Name">
            <input
              autoFocus
              value={slotName}
              onChange={(e) => setSlotName(e.target.value)}
              placeholder="Sugar Rush 1000"
              className="ggb-input"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Provider">
              <input
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder="Pragmatic Play"
                className="ggb-input"
              />
            </Field>
            <Field label="Bet Size">
              <input value={bet} onChange={(e) => setBet(e.target.value)} placeholder="1.00" inputMode="decimal" className="ggb-input" />
            </Field>
          </div>
          <Field label="Image URL (optional)">
            <input
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://…"
              className="ggb-input"
            />
          </Field>
          <Field label="Note (optional)">
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Super Bonus buy" className="ggb-input" />
          </Field>

          {error && <p className="text-xs text-crimson-400">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-[10px] border border-white/10 py-2.5 text-xs font-semibold uppercase tracking-wide text-ash-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="font-heading flex-1 rounded-[10px] bg-gradient-to-b from-lava-300 to-lava-400 py-2.5 text-xs font-bold uppercase tracking-wide text-[#140a04] disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}

function OpenBonusModal({
  bonus,
  currency,
  onClose,
  onSubmit,
}: {
  bonus: HuntBonus;
  currency: string;
  onClose: () => void;
  onSubmit: (payout: number) => Promise<void>;
}) {
  const [payout, setPayout] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payoutNum = Number(payout);
  const preview = Number.isFinite(payoutNum) && bonus.bet > 0 ? payoutNum / bonus.bet : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!Number.isFinite(payoutNum) || payoutNum < 0) return setError("Enter a valid payout");
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(payoutNum);
    } catch (err) {
      setError(err instanceof HuntApiError ? err.message : "Failed to open bonus");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <GlassCard className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <p className="font-heading text-xs font-semibold uppercase tracking-widest text-lava-500">Open Bonus</p>
        <h2 className="mt-1 text-lg font-semibold text-white">{bonus.slotName}</h2>
        <p className="text-xs text-ash-400">
          {bonus.provider} &middot; bet {formatCurrency(bonus.bet, currency)}
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <Field label="Payout">
            <input
              autoFocus
              value={payout}
              onChange={(e) => setPayout(e.target.value)}
              placeholder="0.00"
              inputMode="decimal"
              className="ggb-input"
            />
          </Field>
          {preview !== null && (
            <p className="text-center text-2xl font-bold text-white">
              {preview.toFixed(2)}x{" "}
              <span className="text-sm font-normal text-ash-400">
                = {formatCurrency(payoutNum, currency)}
              </span>
            </p>
          )}

          {error && <p className="text-xs text-crimson-400">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-[10px] border border-white/10 py-2.5 text-xs font-semibold uppercase tracking-wide text-ash-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="font-heading flex-1 rounded-[10px] bg-gradient-to-b from-lava-300 to-lava-400 py-2.5 text-xs font-bold uppercase tracking-wide text-[#140a04] disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Confirm"}
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-300">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
