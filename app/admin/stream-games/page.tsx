"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Trash2, Gamepad2, ArrowRight } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  fetchAllStreamGames,
  createStreamGame,
  updateStreamGame,
  deleteStreamGame,
  StreamGameApiError,
} from "@/lib/streamGamesApi";
import type { StreamGame } from "@/lib/api";

// Stream games with a dedicated live control panel under /admin/stream-games/[slug].
const GAMES_WITH_CONTROL_PANEL = new Set(["chat-vs-streamer", "climb-the-ladder"]);

// Games with their own pre-existing standalone pages link straight there
// instead of the generic /stream-games/[slug] and control-panel routes.
const EXTERNAL_PUBLIC_LINKS: Record<string, string> = {
  "bonus-hunt": "/bonus-hunt",
  tournament: "/tournament",
};
const EXTERNAL_ADMIN_LINKS: Record<string, string> = {
  "bonus-hunt": "/hunt-tracker",
  tournament: "/admin/tournament",
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminStreamGamesPage() {
  const [games, setGames] = useState<StreamGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setGames(await fetchAllStreamGames());
      setError(null);
    } catch (err) {
      setError(err instanceof StreamGameApiError ? err.message : "Failed to load stream games");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    setCreateError(null);
    try {
      const game = await createStreamGame({
        slug: slug || slugify(name),
        name,
        description: description || null,
        imageUrl: imageUrl || null,
      });
      setGames((prev) => [...prev, game]);
      setShowCreate(false);
      setName("");
      setSlug("");
      setDescription("");
      setImageUrl("");
    } catch (err) {
      setCreateError(err instanceof StreamGameApiError ? err.message : "Failed to create stream game");
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (game: StreamGame, field: "isActive" | "isVisible" | "prizeModeEnabled") => {
    const updated = await updateStreamGame(game.id, { [field]: !game[field] });
    setGames((prev) => prev.map((g) => (g.id === game.id ? updated : g)));
  };

  const handlePrizeRulesBlur = async (game: StreamGame, value: string) => {
    if (value === (game.prizeRulesText ?? "")) return;
    const updated = await updateStreamGame(game.id, { prizeRulesText: value || null });
    setGames((prev) => prev.map((g) => (g.id === game.id ? updated : g)));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this stream game permanently? This cannot be undone.")) return;
    try {
      await deleteStreamGame(id);
      setGames((prev) => prev.filter((g) => g.id !== id));
    } catch (err) {
      alert(err instanceof StreamGameApiError ? err.message : "Failed to delete");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ash-300">
          {games.length} stream game{games.length === 1 ? "" : "s"} in the catalog
        </p>
        <Button size="sm" onClick={() => setShowCreate((v) => !v)}>
          <Plus size={15} />
          New Stream Game
        </Button>
      </div>

      {showCreate && (
        <GlassCard>
          <h3 className="font-heading text-sm font-semibold uppercase tracking-widest text-ash-100">New Stream Game</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-300">Name</label>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slug) setSlug(slugify(e.target.value));
                }}
                placeholder="Chat vs Streamer"
                className="ggb-input mt-1"
              />
            </div>
            <div>
              <label className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-300">Slug</label>
              <input
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                placeholder="chat-vs-streamer"
                className="ggb-input mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-300">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="ggb-input mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-300">
                Image URL
              </label>
              <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="ggb-input mt-1" />
            </div>
          </div>
          {createError && <p className="mt-3 text-xs text-crimson-400">{createError}</p>}
          <div className="mt-4 flex gap-2">
            <Button size="sm" disabled={creating || !name || !slug} onClick={handleCreate}>
              {creating ? "Creating…" : "Create"}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
          </div>
        </GlassCard>
      )}

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2 size={24} className="animate-spin text-lava-400" />
        </div>
      ) : error ? (
        <p className="py-16 text-center text-sm text-crimson-400">{error}</p>
      ) : games.length === 0 ? (
        <GlassCard className="py-14 text-center text-sm text-ash-400">
          No stream games yet — create one to get started.
        </GlassCard>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {games.map((game) => (
            <GlassCard key={game.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Gamepad2 size={18} className="text-lava-400" />
                  <div>
                    <h3 className="font-heading text-sm font-bold text-white">{game.name}</h3>
                    <p className="text-xs text-ash-500">/{game.slug}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(game.id)}
                  aria-label="Delete stream game"
                  className="rounded-full p-2 text-ash-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {game.description && <p className="mt-2 text-sm text-ash-300">{game.description}</p>}

              <div className="mt-4 flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-xs text-ash-300">
                  <input
                    type="checkbox"
                    checked={game.isActive}
                    onChange={() => handleToggle(game, "isActive")}
                    className="h-4 w-4 accent-lava-400"
                  />
                  Active
                </label>
                <label className="flex items-center gap-2 text-xs text-ash-300">
                  <input
                    type="checkbox"
                    checked={game.isVisible}
                    onChange={() => handleToggle(game, "isVisible")}
                    className="h-4 w-4 accent-lava-400"
                  />
                  Visible
                </label>
                {game.isActive && game.isVisible && <Badge tone="live">Live</Badge>}
              </div>

              <div className="mt-4 border-t border-white/5 pt-4">
                <label className="flex items-center gap-2 text-xs text-ash-300">
                  <input
                    type="checkbox"
                    checked={game.prizeModeEnabled}
                    onChange={() => handleToggle(game, "prizeModeEnabled")}
                    className="h-4 w-4 accent-gold-400"
                  />
                  Real-world prize mode
                </label>
                {game.prizeModeEnabled && (
                  <textarea
                    key={game.id}
                    defaultValue={game.prizeRulesText ?? ""}
                    onBlur={(e) => handlePrizeRulesBlur(game, e.target.value)}
                    placeholder="Eligibility rules, age/jurisdiction restrictions, official rules link…"
                    rows={2}
                    className="ggb-input mt-2 text-xs"
                  />
                )}
              </div>

              <div className="mt-4 flex items-center gap-3 border-t border-white/5 pt-4">
                <Link
                  href={EXTERNAL_PUBLIC_LINKS[game.slug] ?? `/stream-games/${game.slug}`}
                  className="text-xs font-semibold text-ash-300 hover:text-white"
                >
                  View public page
                </Link>
                {GAMES_WITH_CONTROL_PANEL.has(game.slug) ? (
                  <Link
                    href={`/admin/stream-games/${game.slug}`}
                    className="flex items-center gap-1 text-xs font-semibold text-lava-300 hover:text-lava-200"
                  >
                    Manage rounds <ArrowRight size={12} />
                  </Link>
                ) : (
                  EXTERNAL_ADMIN_LINKS[game.slug] && (
                    <Link
                      href={EXTERNAL_ADMIN_LINKS[game.slug]}
                      className="flex items-center gap-1 text-xs font-semibold text-lava-300 hover:text-lava-200"
                    >
                      Manage <ArrowRight size={12} />
                    </Link>
                  )
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
