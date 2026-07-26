"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, Flame, Lock, Ban, CheckCircle2, XCircle, Radio } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  fetchActivePredictionMatch,
  fetchPredictionMatches,
  createPredictionMatch,
  endPredictionMatch,
  setPredictionChallenge,
  openPredictionRound,
  lockPredictionRound,
  voidPredictionRound,
  resolvePredictionRound,
  StreamGameApiError,
} from "@/lib/streamGamesApi";
import type { PredictionMatch, PredictionMatchFormat } from "@/lib/api";

const SLUG = "chat-vs-streamer";
const POLL_MS = 3000;

const formatInfo: Record<PredictionMatchFormat, { label: string; defaultTarget: number }> = {
  SHORT: { label: "Short Match (first to 5)", defaultTarget: 5 },
  NORMAL: { label: "Normal Stream (first to 15)", defaultTarget: 15 },
  EVENT: { label: "Special Event (best-of-3, first to 5)", defaultTarget: 5 },
};

const CHALLENGE_SUGGESTIONS = [
  "Silly voice for the next 3 rounds",
  "Random prop/hat from the loser box for 10 minutes",
  "Hype dance or 10 pushups on cam",
  "Chat picks the next game from a shortlist",
  "Cartoon/baby face-cam filter for 5 minutes",
];

export default function ChatVsStreamerControlPanel() {
  const [match, setMatch] = useState<PredictionMatch | null>(null);
  const [history, setHistory] = useState<PredictionMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [format, setFormat] = useState<PredictionMatchFormat>("NORMAL");
  const [targetScore, setTargetScore] = useState(15);

  const [question, setQuestion] = useState("");
  const [streamerCall, setStreamerCall] = useState("");

  const [challengeText, setChallengeText] = useState("");

  const load = useCallback(async () => {
    try {
      const [active, matches] = await Promise.all([fetchActivePredictionMatch(SLUG), fetchPredictionMatches(SLUG)]);
      setMatch(active);
      setHistory(matches);
      if (active?.challengeText) setChallengeText(active.challengeText);
    } catch {
      // stay on last known state — the poll will retry
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
  }, [load]);

  const runAction = async (action: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await action();
      await load();
    } catch (err) {
      alert(err instanceof StreamGameApiError ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const currentRound = match?.rounds[0] ?? null;
  const roundInPlay = currentRound && (currentRound.status === "OPEN" || currentRound.status === "LOCKED");

  return (
    <div className="space-y-6">
      <Link
        href="/admin/stream-games"
        className="flex w-fit items-center gap-1.5 text-xs font-semibold text-ash-400 hover:text-white"
      >
        <ArrowLeft size={13} /> Stream Games
      </Link>

      <div>
        <p className="font-heading text-xs font-bold uppercase tracking-[0.3em] text-lava-500">Live Control</p>
        <h2 className="text-ember text-2xl sm:text-3xl">Chat vs Streamer</h2>
      </div>

      {loading ? (
        <div className="flex min-h-[240px] items-center justify-center">
          <Loader2 size={24} className="animate-spin text-lava-400" />
        </div>
      ) : !match ? (
        <GlassCard>
          <h3 className="font-heading text-sm font-semibold uppercase tracking-widest text-ash-100">
            No match running
          </h3>
          <p className="mt-1 text-sm text-ash-300">Start a match to open the game up to Twitch and Kick chat.</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-300">
                Format
              </label>
              <select
                value={format}
                onChange={(e) => {
                  const f = e.target.value as PredictionMatchFormat;
                  setFormat(f);
                  setTargetScore(formatInfo[f].defaultTarget);
                }}
                className="ggb-input mt-1"
              >
                {Object.entries(formatInfo).map(([key, info]) => (
                  <option key={key} value={key}>
                    {info.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-300">
                First to
              </label>
              <input
                type="number"
                min={1}
                value={targetScore}
                onChange={(e) => setTargetScore(Number(e.target.value))}
                className="ggb-input mt-1"
              />
            </div>
          </div>

          <Button
            size="sm"
            className="mt-4"
            disabled={busy}
            onClick={() => runAction(() => createPredictionMatch(SLUG, { format, targetScore }))}
          >
            Start Match
          </Button>
        </GlassCard>
      ) : (
        <>
          {/* Scoreboard */}
          <GlassCard>
            <div className="flex items-center justify-between">
              <Badge tone={match.status === "ACTIVE" ? "live" : "gold"} pulse={match.status === "ACTIVE"}>
                {match.status === "ACTIVE" ? "Match Live" : `${match.winner} Wins`}
              </Badge>
              <span className="font-heading text-xs uppercase tracking-widest text-ash-500">
                First to {match.targetScore} &middot; {formatInfo[match.format].label}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="font-heading text-xs uppercase tracking-widest text-ash-500">Chat</p>
                <p className="text-ember text-4xl">{match.chatScore}</p>
                <p className="mt-1 flex items-center justify-center gap-1 text-xs text-gold-400">
                  {match.chatStreak >= 3 && <Flame size={13} />}
                  {match.chatStreak} streak {match.chatUnderdog && "· underdog x2"}
                </p>
              </div>
              <div>
                <p className="font-heading text-xs uppercase tracking-widest text-ash-500">Streamer</p>
                <p className="text-ember text-4xl">{match.streamerScore}</p>
                <p className="mt-1 flex items-center justify-center gap-1 text-xs text-gold-400">
                  {match.streamerStreak >= 3 && <Flame size={13} />}
                  {match.streamerStreak} streak {match.streamerUnderdog && "· underdog x2"}
                </p>
              </div>
            </div>

            {match.status === "ACTIVE" && (
              <div className="mt-5 border-t border-white/5 pt-4">
                <label className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-300">
                  Loser&apos;s challenge (optional, set anytime)
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    value={challengeText}
                    onChange={(e) => setChallengeText(e.target.value)}
                    placeholder="e.g. Silly voice for the next 3 rounds"
                    list="challenge-suggestions"
                    className="ggb-input"
                  />
                  <datalist id="challenge-suggestions">
                    {CHALLENGE_SUGGESTIONS.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => runAction(() => setPredictionChallenge(match.id, challengeText || null))}
                  >
                    Save
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-3"
                  disabled={busy}
                  onClick={() => {
                    if (confirm("End this match now and declare whoever's ahead the winner?")) {
                      runAction(() => endPredictionMatch(match.id, challengeText || null));
                    }
                  }}
                >
                  End match now
                </Button>
              </div>
            )}
          </GlassCard>

          {/* Round control */}
          {match.status === "ACTIVE" && (
            <GlassCard>
              <h3 className="font-heading text-sm font-semibold uppercase tracking-widest text-ash-100">
                Round {(currentRound?.roundNumber ?? 0) + (roundInPlay ? 0 : 1)}
              </h3>

              {!roundInPlay ? (
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-300">
                      Question
                    </label>
                    <input
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="Does this spin hit the bonus?"
                      className="ggb-input mt-1"
                    />
                  </div>
                  <div>
                    <label className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-300">
                      Streamer&apos;s call
                    </label>
                    <input
                      value={streamerCall}
                      onChange={(e) => setStreamerCall(e.target.value)}
                      placeholder="Bonus hits"
                      className="ggb-input mt-1"
                    />
                  </div>
                  <Button
                    size="sm"
                    disabled={busy || !question || !streamerCall}
                    onClick={() =>
                      runAction(async () => {
                        await openPredictionRound(match.id, { question, streamerCall });
                        setQuestion("");
                        setStreamerCall("");
                      })
                    }
                  >
                    <Radio size={14} /> Open Round
                  </Button>
                </div>
              ) : (
                <div className="mt-3 space-y-4">
                  <p className="text-sm text-ash-100">{currentRound!.question}</p>
                  <p className="text-xs text-ash-400">
                    Streamer&apos;s call: <span className="text-gold-300">{currentRound!.streamerCall}</span>
                  </p>

                  <div className="flex items-center gap-4">
                    <Badge tone={currentRound!.status === "OPEN" ? "live" : "lava"} pulse={currentRound!.status === "OPEN"}>
                      {currentRound!.status}
                    </Badge>
                    <span className="text-xs text-ash-300">
                      {currentRound!.votesChat} chat &middot; {currentRound!.votesStreamer} streamer
                      {currentRound!.chatPick && ` · chat picked ${currentRound!.chatPick}`}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {currentRound!.status === "OPEN" && (
                      <Button size="sm" disabled={busy} onClick={() => runAction(() => lockPredictionRound(currentRound!.id))}>
                        <Lock size={14} /> Lock Round
                      </Button>
                    )}
                    {currentRound!.status === "LOCKED" && (
                      <>
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() => runAction(() => resolvePredictionRound(currentRound!.id, true))}
                        >
                          <CheckCircle2 size={14} /> Streamer Correct
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={busy}
                          onClick={() => runAction(() => resolvePredictionRound(currentRound!.id, false))}
                        >
                          <XCircle size={14} /> Streamer Wrong
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => {
                        if (confirm("Void this round? No points or streak changes either way.")) {
                          runAction(() => voidPredictionRound(currentRound!.id));
                        }
                      }}
                    >
                      <Ban size={14} /> Void
                    </Button>
                  </div>
                </div>
              )}
            </GlassCard>
          )}

          {/* Round history */}
          {match.rounds.length > 0 && (
            <GlassCard className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-xs uppercase tracking-widest text-ash-500">
                      <th className="px-5 py-3 font-semibold">#</th>
                      <th className="px-5 py-3 font-semibold">Question</th>
                      <th className="px-5 py-3 font-semibold">Votes</th>
                      <th className="px-5 py-3 font-semibold">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {match.rounds.map((r) => (
                      <tr key={r.id}>
                        <td className="px-5 py-3 text-ash-400">{r.roundNumber}</td>
                        <td className="px-5 py-3 text-ash-100">{r.question}</td>
                        <td className="px-5 py-3 text-ash-300">
                          {r.votesChat} / {r.votesStreamer}
                        </td>
                        <td className="px-5 py-3">
                          {r.status === "RESOLVED" ? (
                            <Badge tone={r.streamerCorrect ? "gold" : "lava"}>
                              {r.streamerCorrect ? "Streamer" : "Chat"}
                            </Badge>
                          ) : (
                            <Badge tone="neutral">{r.status}</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          )}
        </>
      )}

      {history.length > 1 && (
        <div>
          <h3 className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-500">Past Matches</h3>
          <div className="mt-2 space-y-1.5">
            {history
              .filter((m) => m.status === "COMPLETED")
              .map((m) => (
                <div key={m.id} className="flex items-center justify-between text-xs text-ash-400">
                  <span>
                    Chat {m.chatScore} — Streamer {m.streamerScore}
                  </span>
                  <Badge tone="gold">{m.winner} won</Badge>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
