import type { AppSettings, ThemeId } from '../types.ts';
import { DEFAULT_SETTINGS } from '../types.ts';

const PARAM_MAP: Record<keyof AppSettings, string> = {
  puzzle: 'p',
  inspection: 'ins',
  hidePanelsWhileTiming: 'hp',
  hideTimeWhileTiming: 'ht',
  playSounds: 'snd',
  scrambleLength: 'slen',
  separateScramble: 'sep',
  theme: 't',
  focusMode: 'focus',
};

export function settingsFromUrl(search: string): Partial<AppSettings> | null {
  const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
  if (!params.has('p') && !params.has('ins') && !params.has('t')) return null;

  const partial: Partial<AppSettings> = {};

  const p = params.get('p');
  if (p) {
    const n = Number(p);
    if (n >= 2 && n <= 7) partial.puzzle = n as AppSettings['puzzle'];
  }

  const ins = params.get('ins');
  if (ins === 'off' || ins === '3' || ins === '10' || ins === '15') {
    partial.inspection = ins;
  }

  const theme = params.get('t');
  if (theme === 'dark' || theme === 'light') partial.theme = theme;

  if (params.has('hp')) partial.hidePanelsWhileTiming = params.get('hp') === '1';
  if (params.has('ht')) partial.hideTimeWhileTiming = params.get('ht') === '1';
  if (params.has('snd')) partial.playSounds = params.get('snd') === '1';
  if (params.has('slen')) {
    const len = Number(params.get('slen'));
    if (len >= 8 && len <= 100) partial.scrambleLength = len;
  }
  if (params.has('sep')) partial.separateScramble = params.get('sep') === '1';
  if (params.has('focus')) partial.focusMode = params.get('focus') === '1';

  return partial;
}

export function settingsToUrl(settings: AppSettings): string {
  const params = new URLSearchParams();
  params.set(PARAM_MAP.puzzle, String(settings.puzzle));
  params.set(PARAM_MAP.inspection, settings.inspection);
  params.set(PARAM_MAP.hidePanelsWhileTiming, settings.hidePanelsWhileTiming ? '1' : '0');
  params.set(PARAM_MAP.hideTimeWhileTiming, settings.hideTimeWhileTiming ? '1' : '0');
  params.set(PARAM_MAP.playSounds, settings.playSounds ? '1' : '0');
  params.set(PARAM_MAP.scrambleLength, String(settings.scrambleLength));
  params.set(PARAM_MAP.separateScramble, settings.separateScramble ? '1' : '0');
  params.set(PARAM_MAP.theme, settings.theme);
  params.set(PARAM_MAP.focusMode, settings.focusMode ? '1' : '0');
  return `?${params.toString()}`;
}

export function getShareableUrl(settings: AppSettings): string {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}${settingsToUrl(settings)}`;
}

export function mergeSettings(base: AppSettings, partial: Partial<AppSettings> | null): AppSettings {
  if (!partial) return base;
  return { ...DEFAULT_SETTINGS, ...base, ...partial };
}

export function applyTheme(theme: ThemeId): void {
  document.documentElement.dataset.theme = theme;
}

export function applyFocusMode(enabled: boolean): void {
  document.documentElement.dataset.focus = enabled ? 'true' : 'false';
}
