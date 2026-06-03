import type { InspectionMode, TimerPhase } from '../types.ts';

export type TimerListener = (state: TimerState) => void;

export interface TimerState {
  phase: TimerPhase;
  displayMs: number;
  inspectionRemainingSec: number;
  inspectionPenalty: boolean;
}

export class StackmatTimer {
  private phase: TimerPhase = 'idle';
  private solveStart = 0;
  private inspectionStart = 0;
  private inspectionMode: InspectionMode = 'off';
  private rafId = 0;
  private listeners: TimerListener[] = [];
  private onSolveComplete: (timeMs: number) => void;

  constructor(onSolveComplete: (timeMs: number) => void) {
    this.onSolveComplete = onSolveComplete;
  }

  subscribe(fn: TimerListener): () => void {
    this.listeners.push(fn);
    fn(this.getState());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  setInspectionMode(mode: InspectionMode): void {
    this.inspectionMode = mode;
  }

  private emit(): void {
    const state = this.getState();
    for (const fn of this.listeners) fn(state);
  }

  getState(): TimerState {
    const now = performance.now();
    let displayMs = 0;
    let inspectionRemainingSec = 0;
    let inspectionPenalty = false;

    if (this.phase === 'running') {
      displayMs = now - this.solveStart;
    } else if (this.phase === 'inspection') {
      const limit = this.getInspectionLimitSec();
      const elapsed = (now - this.inspectionStart) / 1000;
      inspectionRemainingSec = Math.max(0, limit - elapsed);
      inspectionPenalty = elapsed > 15 && this.inspectionMode === '15';
      displayMs = 0;
    }

    return {
      phase: this.phase,
      displayMs,
      inspectionRemainingSec,
      inspectionPenalty,
    };
  }

  private getInspectionLimitSec(): number {
    switch (this.inspectionMode) {
      case '3':
        return 3;
      case '10':
        return 10;
      case '15':
        return 15;
      default:
        return 15;
    }
  }

  private startLoop(): void {
    if (this.rafId) return;
    const tick = () => {
      this.emit();
      if (this.phase === 'running' || this.phase === 'inspection') {
        if (this.phase === 'inspection') {
          const limit = this.getInspectionLimitSec();
          const elapsed = (performance.now() - this.inspectionStart) / 1000;
          if (elapsed >= limit) {
            this.phase = 'idle';
            this.emit();
          }
        }
        this.rafId = requestAnimationFrame(tick);
      } else {
        this.rafId = 0;
      }
    };
    this.rafId = requestAnimationFrame(tick);
  }

  press(): void {
    if (this.phase === 'idle') {
      this.phase = 'holding';
      this.emit();
      return;
    }
    if (this.phase === 'running') {
      this.phase = 'stopping';
      this.emit();
    }
  }

  release(): void {
    const now = performance.now();

    if (this.phase === 'holding') {
      if (this.inspectionMode !== 'off') {
        this.phase = 'inspection';
        this.inspectionStart = now;
        this.startLoop();
      } else {
        this.phase = 'running';
        this.solveStart = now;
        this.startLoop();
      }
      this.emit();
      return;
    }

    if (this.phase === 'inspection') {
      this.phase = 'running';
      this.solveStart = now;
      this.startLoop();
      this.emit();
      return;
    }

    if (this.phase === 'stopping') {
      const timeMs = now - this.solveStart;
      this.phase = 'idle';
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = 0;
      }
      this.emit();
      this.onSolveComplete(timeMs);
      return;
    }
  }

  reset(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
    this.phase = 'idle';
    this.emit();
  }

  abortHold(): void {
    if (this.phase === 'holding' || this.phase === 'stopping') {
      this.phase = 'idle';
      this.emit();
    }
  }
}
