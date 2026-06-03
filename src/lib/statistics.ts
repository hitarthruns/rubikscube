export function trimmedAverage(values: number[], count: number, trimEachEnd: number): number | null {
  if (values.length < count) return null;
  const slice = values.slice(-count).sort((a, b) => a - b);
  const trimmed = slice.slice(trimEachEnd, slice.length - trimEachEnd);
  if (trimmed.length === 0) return null;
  return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
}

export function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2;
  }
  return sorted[mid]!;
}

export function stdDev(values: number[]): number | null {
  const avg = mean(values);
  if (avg === null || values.length < 2) return null;
  const variance = values.reduce((s, v) => s + (v - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export interface SessionStats {
  count: number;
  best: number | null;
  worst: number | null;
  average: number | null;
  median: number | null;
  stdDev: number | null;
  ao5: number | null;
  mo3: number | null;
  bestMo3: number | null;
  ao12: number | null;
  mo10: number | null;
  bestMo10: number | null;
}

export function computeStats(effectiveTimesMs: number[]): SessionStats {
  const valid = effectiveTimesMs.filter((t) => t >= 0);
  const sorted = [...valid].sort((a, b) => a - b);

  const ao5 = trimmedAverage(valid, 5, 1);
  const ao12 = trimmedAverage(valid, 12, 1);

  const last5 = valid.slice(-5);
  const mo3 =
    last5.length >= 5
      ? (() => {
          const s = [...last5].sort((a, b) => a - b);
          const mid = s.slice(1, 4);
          return mid.reduce((a, b) => a + b, 0) / 3;
        })()
      : null;

  const bestMo3 = (() => {
    if (valid.length < 5) return null;
    let best: number | null = null;
    for (let i = 0; i <= valid.length - 5; i++) {
      const window = valid.slice(i, i + 5);
      const s = [...window].sort((a, b) => a - b);
      const avg = (s[1]! + s[2]! + s[3]!) / 3;
      if (best === null || avg < best) best = avg;
    }
    return best;
  })();

  const last12 = valid.slice(-12);
  const mo10 =
    last12.length >= 12
      ? (() => {
          const s = [...last12].sort((a, b) => a - b);
          const mid = s.slice(1, 11);
          return mid.reduce((a, b) => a + b, 0) / 10;
        })()
      : null;

  const bestMo10 = (() => {
    if (valid.length < 12) return null;
    let best: number | null = null;
    for (let i = 0; i <= valid.length - 12; i++) {
      const window = valid.slice(i, i + 12);
      const s = [...window].sort((a, b) => a - b);
      const avg = s.slice(1, 11).reduce((a, b) => a + b, 0) / 10;
      if (best === null || avg < best) best = avg;
    }
    return best;
  })();

  return {
    count: valid.length,
    best: sorted[0] ?? null,
    worst: sorted[sorted.length - 1] ?? null,
    average: mean(valid),
    median: median(valid),
    stdDev: stdDev(valid),
    ao5,
    mo3,
    bestMo3,
    ao12,
    mo10,
    bestMo10,
  };
}
