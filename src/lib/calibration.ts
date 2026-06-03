import {
  CARD_HEIGHT_MM,
  CARD_WIDTH_MM,
  HAND_PAD_MM,
  type CalibrationMethod,
  type CalibrationProfile,
} from '../types.ts';

const STORAGE_KEY = 'rc-timer-calibration';

export function loadCalibration(): CalibrationProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CalibrationProfile;
  } catch {
    return null;
  }
}

export function saveCalibration(profile: CalibrationProfile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

function physicalDiagonalPixels(): number {
  const dpr = window.devicePixelRatio || 1;
  const w = window.screen.width * dpr;
  const h = window.screen.height * dpr;
  return Math.sqrt(w * w + h * h);
}

function guessDiagonalInches(): number {
  const minSide = Math.min(window.screen.width, window.screen.height);
  const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (!touch) return 15.6;
  if (minSide < 420) return 6.1;
  if (minSide < 768) return 10.5;
  return 11;
}

export function calibrateAuto(): CalibrationProfile {
  const diagonalInches = guessDiagonalInches();
  const diagonalPx = physicalDiagonalPixels();
  const diagonalMm = diagonalInches * 25.4;
  return {
    pixelsPerMm: diagonalPx / diagonalMm,
    method: 'auto',
    confidence: 'medium',
    diagonalInches,
    updatedAt: Date.now(),
  };
}

export function calibrateFromDiagonal(diagonalInches: number): CalibrationProfile {
  const diagonalPx = physicalDiagonalPixels();
  const diagonalMm = diagonalInches * 25.4;
  return {
    pixelsPerMm: diagonalPx / diagonalMm,
    method: 'diagonal',
    confidence: 'medium',
    diagonalInches,
    updatedAt: Date.now(),
  };
}

export function calibrateFromCardMeasured(outlineWidthPx: number, cardScale: number): CalibrationProfile {
  return {
    pixelsPerMm: outlineWidthPx / CARD_WIDTH_MM,
    method: 'card',
    confidence: 'high',
    cardScale,
    updatedAt: Date.now(),
  };
}

export function handPadSizePx(profile: CalibrationProfile | null): number {
  const ppm = profile?.pixelsPerMm ?? calibrateAuto().pixelsPerMm;
  return Math.round(HAND_PAD_MM * ppm);
}

export function cardOverlaySizePx(profile: CalibrationProfile | null): {
  width: number;
  height: number;
} {
  const ppm = profile?.pixelsPerMm ?? calibrateAuto().pixelsPerMm;
  return {
    width: Math.round(CARD_WIDTH_MM * ppm),
    height: Math.round(CARD_HEIGHT_MM * ppm),
  };
}

export function methodLabel(method: CalibrationMethod): string {
  switch (method) {
    case 'auto':
      return 'Auto-Detect Device';
    case 'diagonal':
      return 'Screen Diagonal';
    case 'card':
      return 'Credit Card';
  }
}
