export type PuzzleSize = 2 | 3 | 4 | 5 | 6 | 7;

export type CalibrationMethod = 'auto' | 'diagonal' | 'card';

export type TimerPhase = 'idle' | 'holding' | 'inspection' | 'running' | 'stopping';

export type InspectionMode = 'off' | '3' | '10' | '15';

export type ThemeId = 'dark' | 'light';

export interface CalibrationProfile {
  pixelsPerMm: number;
  method: CalibrationMethod;
  confidence: 'high' | 'medium' | 'low';
  diagonalInches?: number;
  cardScale?: number;
  updatedAt: number;
}

export interface SolveRecord {
  id: string;
  timeMs: number;
  scramble: string;
  puzzle: PuzzleSize;
  penalty: 'none' | '+2' | 'DNF';
  comment: string;
  createdAt: number;
}

export interface AppSettings {
  puzzle: PuzzleSize;
  inspection: InspectionMode;
  hidePanelsWhileTiming: boolean;
  hideTimeWhileTiming: boolean;
  playSounds: boolean;
  scrambleLength: number;
  separateScramble: boolean;
  theme: ThemeId;
  focusMode: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  puzzle: 3,
  inspection: 'off',
  hidePanelsWhileTiming: true,
  hideTimeWhileTiming: false,
  playSounds: true,
  scrambleLength: 20,
  separateScramble: true,
  theme: 'dark',
  focusMode: false,
};

export const CARD_WIDTH_MM = 85.6;
export const CARD_HEIGHT_MM = 53.98;
export const HAND_PAD_MM = 80;
