export function formatTime(ms: number, showMs = true): string {
  if (ms < 0 || !Number.isFinite(ms)) return '—';
  const totalCs = Math.floor(ms / 10);
  const cs = totalCs % 100;
  const totalSec = Math.floor(totalCs / 100);
  const sec = totalSec % 60;
  const min = Math.floor(totalSec / 60);
  if (min > 0) {
    return `${min}:${sec.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
  }
  if (showMs) {
    return `${sec}.${cs.toString().padStart(2, '0')}`;
  }
  return `${sec}.${Math.floor(cs / 10)}`;
}

export function formatInspection(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  return s.toString();
}

export function parseTime(input: string): number | null {
  const s = input.trim().toUpperCase();
  if (s === 'DNF' || s === '—' || s === '-') return null;

  const colonMatch = s.match(/^(\d+):(\d{1,2})\.(\d{1,2})$/);
  if (colonMatch) {
    const min = Number(colonMatch[1]);
    const sec = Number(colonMatch[2]);
    const frac = colonMatch[3]!.padEnd(2, '0').slice(0, 2);
    return (min * 60 + sec) * 1000 + Number(frac) * 10;
  }

  const dotMatch = s.match(/^(\d+)\.(\d{1,3})$/);
  if (dotMatch) {
    const sec = Number(dotMatch[1]);
    const frac = dotMatch[2]!.padEnd(2, '0').slice(0, 2);
    return sec * 1000 + Number(frac) * 10;
  }

  const plain = Number(s);
  if (!Number.isNaN(plain) && plain >= 0) return Math.round(plain * 1000);
  return null;
}

export function applyPenalty(timeMs: number, penalty: 'none' | '+2' | 'DNF'): number | null {
  if (penalty === 'DNF') return null;
  if (penalty === '+2') return timeMs + 2000;
  return timeMs;
}
