import type { BingoCell, BingoLineWin } from "@/lib/api";

export function participantName(p: { chatUsername: string; user?: { displayName: string } | null } | null | undefined): string {
  return p?.user?.displayName ?? p?.chatUsername ?? "?";
}

export function cellClaimerName(cell: { claimedByChatUsername: string | null; claimedBy?: { displayName: string } | null } | null | undefined): string {
  return cell?.claimedBy?.displayName ?? cell?.claimedByChatUsername ?? "?";
}

export function lineLabel(lineType: string, lineIndex: number): string {
  if (lineType === "row") return `Row ${lineIndex + 1}`;
  if (lineType === "col") return `Column ${lineIndex + 1}`;
  if (lineType === "diag" && lineIndex === 0) return "Main Diagonal ↘";
  if (lineType === "diag" && lineIndex === 1) return "Anti-Diagonal ↙";
  return "Line";
}

/** Cell-membership math mirrors the server's line detection — used to render
 * a ring around every cell that's part of a completed line. */
export function isCellInLine(cell: { row: number; col: number }, line: { lineType: string; lineIndex: number }, gridSize: number): boolean {
  if (line.lineType === "row") return cell.row === line.lineIndex;
  if (line.lineType === "col") return cell.col === line.lineIndex;
  if (line.lineType === "diag" && line.lineIndex === 0) return cell.row === cell.col;
  if (line.lineType === "diag" && line.lineIndex === 1) return cell.row + cell.col === gridSize - 1;
  return false;
}

export function lineWinnerNames(cells: BingoCell[], line: BingoLineWin, gridSize: number): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const cell of cells) {
    if (cell.status !== "GREEN" || !isCellInLine(cell, line, gridSize)) continue;
    const key = cell.claimedByUserId ?? cell.claimedByChatUsername;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    names.push(cellClaimerName(cell));
  }
  return names;
}

export function wonCellKeys(cells: BingoCell[], lineWins: BingoLineWin[], gridSize: number): Set<string> {
  const keys = new Set<string>();
  for (const win of lineWins) {
    for (const cell of cells) {
      if (isCellInLine(cell, win, gridSize)) keys.add(`${cell.row}:${cell.col}`);
    }
  }
  return keys;
}
