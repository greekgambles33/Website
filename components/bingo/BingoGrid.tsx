"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { cellClaimerName, wonCellKeys } from "@/lib/bingoUtils";
import type { BingoGame } from "@/lib/api";

/** Shared grid renderer for the admin control panel and public page. Cell
 * click is only wired up by the admin panel (manual slot picker); the public
 * page passes no handler and cells become inert. */
export function BingoGrid({
  game,
  onActiveCellClick,
  highlightChatUsername,
}: {
  game: BingoGame;
  onActiveCellClick?: () => void;
  highlightChatUsername?: string | null;
}) {
  const wonKeys = wonCellKeys(game.cells, game.lineWins, game.gridSize);

  return (
    <div
      className="mx-auto grid gap-2"
      style={{ gridTemplateColumns: `repeat(${game.gridSize}, minmax(0, 1fr))`, maxWidth: game.gridSize <= 3 ? 320 : game.gridSize === 4 ? 380 : 440 }}
    >
      {game.cells.map((cell) => {
        const cellNumber = cell.row * game.gridSize + cell.col + 1;
        const isWonCell = wonKeys.has(`${cell.row}:${cell.col}`);
        const isMine = highlightChatUsername && cell.claimedByChatUsername === highlightChatUsername;
        const isActiveClickable = cell.status === "ACTIVE" && !cell.slotName && onActiveCellClick;

        return (
          <button
            key={cell.id}
            type="button"
            disabled={!isActiveClickable}
            onClick={isActiveClickable ? onActiveCellClick : undefined}
            className={cn(
              "flex aspect-square flex-col items-center justify-center rounded-lg border p-1 text-center transition-colors",
              cell.status === "GREEN" && "border-emerald-500/50 bg-emerald-500/15",
              cell.status === "ACTIVE" && "border-gold-400/60 bg-gold-500/10",
              cell.status === "EMPTY" && "border-white/5 bg-white/[0.02]",
              isWonCell && "ring-2 ring-gold-400/70",
              isMine && "ring-2 ring-yellow-400/60",
              isActiveClickable && "cursor-pointer hover:border-gold-300"
            )}
          >
            {cell.status === "GREEN" ? (
              <>
                <span className="truncate text-[10px] font-semibold text-emerald-200">{cellClaimerName(cell)}</span>
                {cell.slotName && <span className="truncate text-[9px] text-emerald-300/70">{cell.slotName}</span>}
              </>
            ) : cell.status === "ACTIVE" ? (
              <>
                <Star size={12} className="animate-bounce text-gold-300" />
                {game.currentChatUsername ? (
                  <>
                    <span className="truncate text-[10px] font-semibold text-gold-100">{game.currentChatUsername}</span>
                    <span className="truncate text-[9px] text-gold-300/80">{cell.slotName ?? "picking slot…"}</span>
                  </>
                ) : (
                  <span className="text-[9px] text-gold-300/70">drawing…</span>
                )}
              </>
            ) : (
              <span className="text-xs text-ash-600">{cellNumber}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
