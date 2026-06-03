type Color = 'W' | 'Y' | 'R' | 'O' | 'B' | 'G';
type Face = Color[][];

const COLORS: Record<Color, string> = {
  W: '#f4f4f4',
  Y: '#f5d000',
  R: '#d62828',
  O: '#f77f00',
  B: '#1d4ed8',
  G: '#2a9d4b',
};

interface CubeState {
  U: Face;
  D: Face;
  L: Face;
  R: Face;
  F: Face;
  B: Face;
}

function face(c: Color): Face {
  return [
    [c, c, c],
    [c, c, c],
    [c, c, c],
  ];
}

function solved(): CubeState {
  return {
    U: face('W'),
    D: face('Y'),
    L: face('O'),
    R: face('R'),
    F: face('G'),
    B: face('B'),
  };
}

function rotateFaceCW(f: Face): Face {
  return [
    [f[2]![0]!, f[1]![0]!, f[0]![0]!],
    [f[2]![1]!, f[1]![1]!, f[0]![1]!],
    [f[2]![2]!, f[1]![2]!, f[0]![2]!],
  ];
}

function rotateFaceCCW(f: Face): Face {
  return rotateFaceCW(rotateFaceCW(rotateFaceCW(f)));
}

function applyMove(cube: CubeState, move: string): void {
  const faceKey = move[0] as keyof CubeState;
  const suffix = move.slice(1);
  const times = suffix === '2' ? 2 : suffix === "'" ? 3 : 1;
  const rotate = suffix === "'" ? rotateFaceCCW : rotateFaceCW;

  for (let t = 0; t < times; t++) {
    const f = cube[faceKey];
    cube[faceKey] = rotate(f);

    if (faceKey === 'U') {
      const t0 = [cube.F[0]![0]!, cube.F[0]![1]!, cube.F[0]![2]!];
      cube.F[0] = [cube.R[0]![0]!, cube.R[0]![1]!, cube.R[0]![2]!];
      cube.R[0] = [cube.B[0]![0]!, cube.B[0]![1]!, cube.B[0]![2]!];
      cube.B[0] = [cube.L[0]![0]!, cube.L[0]![1]!, cube.L[0]![2]!];
      cube.L[0] = t0;
    } else if (faceKey === 'D') {
      const t0 = [cube.F[2]![0]!, cube.F[2]![1]!, cube.F[2]![2]!];
      cube.F[2] = [cube.L[2]![0]!, cube.L[2]![1]!, cube.L[2]![2]!];
      cube.L[2] = [cube.B[2]![0]!, cube.B[2]![1]!, cube.B[2]![2]!];
      cube.B[2] = [cube.R[2]![0]!, cube.R[2]![1]!, cube.R[2]![2]!];
      cube.R[2] = t0;
    } else if (faceKey === 'F') {
      const t0 = [cube.U[2]![0]!, cube.U[2]![1]!, cube.U[2]![2]!];
      cube.U[2] = [cube.L[2]![2]!, cube.L[1]![2]!, cube.L[0]![2]!];
      cube.L[0]![2] = cube.D[0]![0]!;
      cube.L[1]![2] = cube.D[0]![1]!;
      cube.L[2]![2] = cube.D[0]![2]!;
      cube.D[0] = [cube.R[0]![0]!, cube.R[1]![0]!, cube.R[2]![0]!];
      cube.R[0]![0] = t0[2]!;
      cube.R[1]![0] = t0[1]!;
      cube.R[2]![0] = t0[0]!;
    } else if (faceKey === 'B') {
      const t0 = [cube.U[0]![0]!, cube.U[0]![1]!, cube.U[0]![2]!];
      cube.U[0] = [cube.R[0]![2]!, cube.R[1]![2]!, cube.R[2]![2]!];
      cube.R[0]![2] = cube.D[2]![2]!;
      cube.R[1]![2] = cube.D[2]![1]!;
      cube.R[2]![2] = cube.D[2]![0]!;
      cube.D[2] = [cube.L[0]![0]!, cube.L[1]![0]!, cube.L[2]![0]!];
      cube.L[0]![0] = t0[2]!;
      cube.L[1]![0] = t0[1]!;
      cube.L[2]![0] = t0[0]!;
    } else if (faceKey === 'R') {
      const t0 = [cube.U[0]![2]!, cube.U[1]![2]!, cube.U[2]![2]!];
      cube.U[0]![2] = cube.F[0]![2]!;
      cube.U[1]![2] = cube.F[1]![2]!;
      cube.U[2]![2] = cube.F[2]![2]!;
      cube.F[0]![2] = cube.D[0]![2]!;
      cube.F[1]![2] = cube.D[1]![2]!;
      cube.F[2]![2] = cube.D[2]![2]!;
      cube.D[0]![2] = cube.B[2]![0]!;
      cube.D[1]![2] = cube.B[1]![0]!;
      cube.D[2]![2] = cube.B[0]![0]!;
      cube.B[0]![0] = t0[2]!;
      cube.B[1]![0] = t0[1]!;
      cube.B[2]![0] = t0[0]!;
    } else if (faceKey === 'L') {
      const t0 = [cube.U[0]![0]!, cube.U[1]![0]!, cube.U[2]![0]!];
      cube.U[0]![0] = cube.B[2]![2]!;
      cube.U[1]![0] = cube.B[1]![2]!;
      cube.U[2]![0] = cube.B[0]![2]!;
      cube.B[0]![2] = cube.D[2]![0]!;
      cube.B[1]![2] = cube.D[1]![0]!;
      cube.B[2]![2] = cube.D[0]![0]!;
      cube.D[0]![0] = cube.F[0]![0]!;
      cube.D[1]![0] = cube.F[1]![0]!;
      cube.D[2]![0] = cube.F[2]![0]!;
      cube.F[0]![0] = t0[0]!;
      cube.F[1]![0] = t0[1]!;
      cube.F[2]![0] = t0[2]!;
    }
  }
}

function parseMoves(scramble: string): string[] {
  return scramble.match(/[RLUDFB][2']?/g) ?? [];
}

export function scrambleToSvg(scramble: string, size = 140): string {
  const cube = solved();
  for (const move of parseMoves(scramble)) {
    if ('RLUDFB'.includes(move[0]!)) applyMove(cube, move);
  }

  const cell = size / 12;
  const gap = 2;
  const faces: { key: keyof CubeState; x: number; y: number }[] = [
    { key: 'U', x: 3, y: 0 },
    { key: 'L', x: 0, y: 3 },
    { key: 'F', x: 3, y: 3 },
    { key: 'R', x: 6, y: 3 },
    { key: 'B', x: 9, y: 3 },
    { key: 'D', x: 3, y: 6 },
  ];

  let rects = '';
  for (const { key, x, y } of faces) {
    const f = cube[key];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const color = COLORS[f[r]![c]!];
        const px = (x + c) * (cell + gap) + gap;
        const py = (y + r) * (cell + gap) + gap;
        rects += `<rect x="${px}" y="${py}" width="${cell}" height="${cell}" fill="${color}" rx="2"/>`;
      }
    }
  }

  const w = 12 * (cell + gap) + gap;
  const h = 9 * (cell + gap) + gap;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${size}" height="${(size * h) / w}" aria-hidden="true">${rects}</svg>`;
}
