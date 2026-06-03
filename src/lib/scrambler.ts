import type { PuzzleSize } from '../types.ts';

const FACES_3 = ['R', 'L', 'U', 'D', 'F', 'B'] as const;
const OPPOSITE: Record<string, string> = {
  R: 'L',
  L: 'R',
  U: 'D',
  D: 'U',
  F: 'B',
  B: 'F',
};

const SUFFIXES = ['', "'", '2'] as const;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function random3x3Move(length: number): string {
  const moves: string[] = [];
  let lastFace = '';

  while (moves.length < length) {
    let face: string;
    let attempts = 0;
    do {
      face = pick(FACES_3);
      attempts++;
    } while ((face === lastFace || OPPOSITE[face] === lastFace) && attempts < 24);
    if (face === lastFace || OPPOSITE[face] === lastFace) continue;
    moves.push(face + pick(SUFFIXES));
    lastFace = face;
  }
  return moves.join(' ');
}

function randomNxN(puzzle: PuzzleSize, length: number): string {
  const faces =
    puzzle === 2
      ? (['R', 'U', 'F'] as const)
      : puzzle >= 4
        ? (['R', 'L', 'U', 'D', 'F', 'B', 'Rw', 'Uw', 'Fw'] as const)
        : FACES_3;
  const moves: string[] = [];
  let last = '';
  for (let i = 0; i < length; i++) {
    let face: string;
    do {
      face = pick(faces);
    } while (face[0] === last[0]);
    const suffix = pick(SUFFIXES);
    moves.push(face + suffix);
    last = face;
  }
  return moves.join(' ');
}

const LENGTH_BY_PUZZLE: Record<PuzzleSize, number> = {
  2: 9,
  3: 20,
  4: 40,
  5: 60,
  6: 80,
  7: 100,
};

export function generateScramble(puzzle: PuzzleSize, length?: number): string {
  const len = length ?? LENGTH_BY_PUZZLE[puzzle];
  if (puzzle === 3) return random3x3Move(len);
  return randomNxN(puzzle, len);
}

export function formatScrambleDisplay(scramble: string, separate: boolean): string {
  if (!separate) return scramble;
  return scramble.replace(/([RLUDFB][w']?|['2]+)/g, (m) => m.trim()).replace(/  +/g, ' ').trim();
}
