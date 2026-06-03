import { parseTime } from './format.ts';
import type { PuzzleSize, SolveRecord } from '../types.ts';

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function parseImportText(text: string, defaultPuzzle: PuzzleSize = 3): SolveRecord[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const solves: SolveRecord[] = [];

  for (const line of lines) {
    if (line.startsWith('#')) continue;

    const parts = line.split('\t');
    if (parts.length >= 3) {
      const timeMs = parseTime(parts[0]!);
      if (timeMs === null) continue;
      const puzzleMatch = parts[1]!.match(/(\d)/);
      const puzzle = (puzzleMatch ? Number(puzzleMatch[1]) : defaultPuzzle) as PuzzleSize;
      const penalty = (parts[3] === '+2' || parts[3] === 'DNF' ? parts[3] : 'none') as SolveRecord['penalty'];
      solves.push({
        id: uid(),
        timeMs: penalty === '+2' ? Math.max(0, timeMs - 2000) : timeMs,
        scramble: parts[2] ?? '',
        puzzle: puzzle >= 2 && puzzle <= 7 ? puzzle : defaultPuzzle,
        penalty,
        comment: parts[4] ?? '',
        createdAt: Date.now(),
      });
      continue;
    }

    const timeMs = parseTime(line);
    if (timeMs !== null) {
      solves.push({
        id: uid(),
        timeMs,
        scramble: '',
        puzzle: defaultPuzzle,
        penalty: 'none',
        comment: '',
        createdAt: Date.now(),
      });
    }
  }

  return solves;
}

export function formatExportLine(solve: SolveRecord, effectiveLabel: string): string {
  return `${effectiveLabel}\t${solve.puzzle}x${solve.puzzle}\t${solve.scramble}\t${solve.penalty}\t${solve.comment}`;
}
