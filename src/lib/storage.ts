import type { AppSettings, SolveRecord } from '../types.ts';
import { DEFAULT_SETTINGS } from '../types.ts';

const SETTINGS_KEY = 'rc-timer-settings';
const SOLVES_KEY = 'rc-timer-solves';

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadSolves(): SolveRecord[] {
  try {
    const raw = localStorage.getItem(SOLVES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SolveRecord[];
  } catch {
    return [];
  }
}

export function saveSolves(solves: SolveRecord[]): void {
  localStorage.setItem(SOLVES_KEY, JSON.stringify(solves));
}
