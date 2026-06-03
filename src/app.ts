import {
  calibrateAuto,
  calibrateFromCardMeasured,
  calibrateFromDiagonal,
  cardOverlaySizePx,
  handPadSizePx,
  loadCalibration,
  methodLabel,
  saveCalibration,
} from './lib/calibration.ts';
import { scrambleToSvg } from './lib/cubeViz.ts';
import { applyPenalty, formatInspection, formatTime } from './lib/format.ts';
import { formatExportLine, parseImportText } from './lib/importExport.ts';
import { formatScrambleDisplay, generateScramble } from './lib/scrambler.ts';
import {
  applyFocusMode,
  applyTheme,
  getShareableUrl,
  mergeSettings,
  settingsFromUrl,
} from './lib/shareUrl.ts';
import { sounds } from './lib/sounds.ts';
import { computeStats } from './lib/statistics.ts';
import { loadSettings, loadSolves, saveSettings, saveSolves } from './lib/storage.ts';
import { StackmatTimer } from './lib/timer.ts';
import type {
  AppSettings,
  CalibrationProfile,
  PuzzleSize,
  SolveRecord,
} from './types.ts';
function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export class CubeTimerApp {
  private settings: AppSettings;
  private solves: SolveRecord[];
  private calibration: CalibrationProfile | null;
  private currentScramble = '';
  private activeSolveId: string | null = null;
  private holding = false;
  private timer: StackmatTimer;

  private el = {
    scramble: document.getElementById('scramble-text')!,
    display: document.getElementById('timer-display')!,
    status: document.getElementById('timer-status')!,
    hint: document.getElementById('timer-hint')!,
    stage: document.getElementById('timer-stage')!,
    core: document.getElementById('timer-core')!,
    padLeft: document.getElementById('pad-left') as HTMLButtonElement,
    padRight: document.getElementById('pad-right') as HTMLButtonElement,
    panels: document.getElementById('panels')!,
    main: document.getElementById('main-area')!,
    timesList: document.getElementById('times-list')!,
    statsGrid: document.getElementById('stats-grid')!,
    cubeViz: document.getElementById('cube-viz')!,
    vizPanel: document.getElementById('viz-panel')!,
    settingsDialog: document.getElementById('settings-dialog') as HTMLDialogElement,
    calibrationDialog: document.getElementById('calibration-dialog') as HTMLDialogElement,
    solveDialog: document.getElementById('solve-dialog') as HTMLDialogElement,
    importDialog: document.getElementById('import-dialog') as HTMLDialogElement,
    calStatus: document.getElementById('cal-status')!,
    cardOutline: document.getElementById('card-outline')!,
    cardSlider: document.getElementById('cal-card-slider') as HTMLInputElement,
    cardScaleLabel: document.getElementById('cal-card-scale-label')!,
    shareUrl: document.getElementById('share-url') as HTMLInputElement,
  };

  constructor() {
    const fromUrl = settingsFromUrl(window.location.search);
    this.settings = mergeSettings(loadSettings(), fromUrl);
    saveSettings(this.settings);

    this.solves = loadSolves();
    this.calibration = loadCalibration();

    this.timer = new StackmatTimer((ms) => this.onSolveComplete(ms));
    this.timer.setInspectionMode(this.settings.inspection);
    this.timer.subscribe((s) => this.onTimerState(s));

    this.applySettingsUi();
    this.applyCalibration();
    this.newScramble();
    this.renderTimes();
    this.renderStats();
    this.bindEvents();
    this.syncSettingsForm();
    this.updateShareUrl();

    if (!this.calibration) {
      this.calibration = calibrateAuto();
      saveCalibration(this.calibration);
      this.applyCalibration();
    }
  }

  private applySettingsUi(): void {
    applyTheme(this.settings.theme);
    applyFocusMode(this.settings.focusMode);
  }

  private applySettings(patch?: Partial<AppSettings>): void {
    if (patch) this.settings = { ...this.settings, ...patch };
    saveSettings(this.settings);
    this.timer.setInspectionMode(this.settings.inspection);
    this.applySettingsUi();
    this.syncSettingsForm();
    this.updateShareUrl();
    this.syncUrlBar();
    this.newScramble();
  }

  private syncUrlBar(): void {
    const url = new URL(window.location.href);
    const params = new URLSearchParams();
    params.set('p', String(this.settings.puzzle));
    params.set('ins', this.settings.inspection);
    params.set('hp', this.settings.hidePanelsWhileTiming ? '1' : '0');
    params.set('ht', this.settings.hideTimeWhileTiming ? '1' : '0');
    params.set('snd', this.settings.playSounds ? '1' : '0');
    params.set('slen', String(this.settings.scrambleLength));
    params.set('sep', this.settings.separateScramble ? '1' : '0');
    params.set('t', this.settings.theme);
    params.set('focus', this.settings.focusMode ? '1' : '0');
    url.search = params.toString();
    window.history.replaceState({}, '', url);
  }

  private updateShareUrl(): void {
    if (this.el.shareUrl) {
      this.el.shareUrl.value = getShareableUrl(this.settings);
    }
  }

  private toggleFocusMode(): void {
    this.applySettings({ focusMode: !this.settings.focusMode });
  }

  private bindEvents(): void {
    document.getElementById('btn-settings')!.addEventListener('click', () => {
      this.updateShareUrl();
      this.el.settingsDialog.showModal();
    });

    document.getElementById('btn-focus')!.addEventListener('click', () => this.toggleFocusMode());

    document.getElementById('btn-calibrate')!.addEventListener('click', () => {
      this.openCalibration();
    });

    document.getElementById('calibration-close')!.addEventListener('click', () => {
      this.el.calibrationDialog.close();
    });

    document.getElementById('btn-new-scramble')!.addEventListener('click', () => this.newScramble());
    document.getElementById('btn-clear-times')!.addEventListener('click', () => {
      if (confirm('Clear all times in this session?')) {
        this.solves = [];
        saveSolves(this.solves);
        this.renderTimes();
        this.renderStats();
      }
    });

    document.getElementById('btn-export')!.addEventListener('click', () => this.exportTimes());
    document.getElementById('btn-import')!.addEventListener('click', () => this.openImport());
    document.getElementById('btn-copy-scramble')!.addEventListener('click', () => this.copyScramble());
    document.getElementById('btn-copy-share')!.addEventListener('click', () => this.copyShareUrl());

    this.bindSettings();
    this.bindCalibration();
    this.bindSolveDialog();
    this.bindImport();
    this.bindTimerInput();

    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
  }

  private async copyScramble(): Promise<void> {
    await navigator.clipboard.writeText(this.currentScramble);
    const btn = document.getElementById('btn-copy-scramble')!;
    const prev = btn.textContent;
    btn.textContent = '✓';
    setTimeout(() => {
      btn.textContent = prev;
    }, 1200);
  }

  private async copyShareUrl(): Promise<void> {
    await navigator.clipboard.writeText(this.el.shareUrl.value);
  }

  private openImport(): void {
    (document.getElementById('import-text') as HTMLTextAreaElement).value = '';
    (document.getElementById('import-error') as HTMLElement).classList.add('hidden');
    this.el.importDialog.showModal();
  }

  private bindImport(): void {
    document.getElementById('import-form')!.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = (document.getElementById('import-text') as HTMLTextAreaElement).value;
      const replace = (document.getElementById('import-replace') as HTMLInputElement).checked;
      const parsed = parseImportText(text, this.settings.puzzle);
      const errEl = document.getElementById('import-error')!;

      if (parsed.length === 0) {
        errEl.textContent = 'No valid times found. Use format 12.34 or tab-separated export lines.';
        errEl.classList.remove('hidden');
        return;
      }

      this.solves = replace ? parsed : [...this.solves, ...parsed];
      saveSolves(this.solves);
      this.renderTimes();
      this.renderStats();
      errEl.classList.add('hidden');
      this.el.importDialog.close();
    });
  }

  private bindTimerInput(): void {
    const press = () => this.handlePress();
    const release = () => this.handleRelease();

    this.el.core.addEventListener('mousedown', (e) => {
      e.preventDefault();
      press();
    });
    this.el.core.addEventListener('mouseup', release);
    this.el.core.addEventListener('mouseleave', () => {
      if (this.holding) this.handleRelease();
    });

    this.el.padLeft.addEventListener('mousedown', (e) => {
      e.preventDefault();
      press();
    });
    this.el.padRight.addEventListener('mousedown', (e) => {
      e.preventDefault();
      press();
    });
    this.el.padLeft.addEventListener('mouseup', release);
    this.el.padRight.addEventListener('mouseup', release);
    this.el.padLeft.addEventListener('mouseleave', () => {
      if (this.holding) release();
    });
    this.el.padRight.addEventListener('mouseleave', () => {
      if (this.holding) release();
    });

    const touchStart = (e: Event) => {
      e.preventDefault();
      press();
    };
    const touchEnd = (e: Event) => {
      e.preventDefault();
      release();
    };

    for (const pad of [this.el.core, this.el.padLeft, this.el.padRight]) {
      pad.addEventListener('touchstart', touchStart, { passive: false });
      pad.addEventListener('touchend', touchEnd, { passive: false });
      pad.addEventListener('touchcancel', touchEnd, { passive: false });
    }
  }

  private onKeyDown(e: KeyboardEvent): void {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    if (e.code === 'KeyF' && !e.repeat) {
      e.preventDefault();
      this.toggleFocusMode();
      return;
    }

    if (e.code !== 'Space' || e.repeat) return;
    e.preventDefault();
    this.handlePress();
  }

  private onKeyUp(e: KeyboardEvent): void {
    if (e.code !== 'Space') return;
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    e.preventDefault();
    this.handleRelease();
  }

  private handlePress(): void {
    if (this.holding) return;
    this.holding = true;
    this.timer.press();
    if (this.settings.playSounds) sounds.ready();
  }

  private handleRelease(): void {
    if (!this.holding) return;
    this.holding = false;
    const prev = this.timer.getState().phase;
    this.timer.release();
    const next = this.timer.getState().phase;
    if (this.settings.playSounds) {
      if (prev === 'holding' && next === 'running') sounds.start();
      if (prev === 'holding' && next === 'inspection') sounds.ready();
      if (prev === 'stopping') sounds.stop();
      if (prev === 'inspection' && next === 'running') sounds.start();
    }
  }

  private onTimerState(state: ReturnType<StackmatTimer['getState']>): void {
    const { phase, displayMs, inspectionRemainingSec } = state;

    this.el.stage.dataset.phase = phase;
    this.el.main.dataset.timing = phase === 'running' || phase === 'inspection' ? 'true' : 'false';

    if (phase === 'inspection') {
      this.el.display.textContent = formatInspection(inspectionRemainingSec);
      this.el.status.textContent = 'Inspection';
      this.el.hint.textContent = 'Release pads when ready to solve';
    } else if (this.settings.hideTimeWhileTiming && phase === 'running') {
      this.el.display.textContent = '—';
      this.el.status.textContent = 'Solving';
      this.el.hint.textContent = 'Hold to stop';
    } else {
      this.el.display.textContent = formatTime(displayMs);
      if (phase === 'holding') {
        this.el.status.textContent = 'Ready';
        this.el.hint.textContent = 'Release to start';
      } else if (phase === 'running') {
        this.el.status.textContent = 'Solving';
        this.el.hint.textContent = 'Hold to stop';
      } else if (phase === 'stopping') {
        this.el.status.textContent = 'Stopping';
        this.el.hint.textContent = 'Release to record';
      } else {
        this.el.status.textContent = '';
        this.el.hint.textContent = 'Hold space or pads — release to start';
      }
    }

    const hidePanels =
      this.settings.hidePanelsWhileTiming || this.settings.focusMode;
    if (hidePanels) {
      this.el.panels.classList.toggle('hidden', phase === 'running' || phase === 'inspection');
    } else {
      this.el.panels.classList.remove('hidden');
    }
  }

  private onSolveComplete(timeMs: number): void {
    const record: SolveRecord = {
      id: uid(),
      timeMs,
      scramble: this.currentScramble,
      puzzle: this.settings.puzzle,
      penalty: 'none',
      comment: '',
      createdAt: Date.now(),
    };
    this.solves.push(record);
    saveSolves(this.solves);
    this.renderTimes();
    this.renderStats();
    this.newScramble();
    this.activeSolveId = record.id;
    this.openSolveDialog(record);
  }

  private newScramble(): void {
    this.currentScramble = generateScramble(this.settings.puzzle, this.settings.scrambleLength);
    this.el.scramble.textContent = formatScrambleDisplay(
      this.currentScramble,
      this.settings.separateScramble,
    );
    this.renderCubeViz();
  }

  private renderCubeViz(): void {
    if (this.settings.puzzle === 3 && this.currentScramble) {
      this.el.cubeViz.innerHTML = scrambleToSvg(this.currentScramble, 160);
      this.el.vizPanel.classList.remove('hidden-viz');
    } else {
      this.el.cubeViz.innerHTML = '<p class="viz-placeholder">3×3 preview only</p>';
      this.el.vizPanel.classList.toggle('hidden-viz', this.settings.puzzle !== 3);
    }
  }

  private effectiveTimes(): number[] {
    return this.solves
      .map((s) => applyPenalty(s.timeMs, s.penalty))
      .filter((t): t is number => t !== null);
  }

  private renderStats(): void {
    const stats = computeStats(this.effectiveTimes());
    const rows: [string, string][] = [
      ['Best', stats.best !== null ? formatTime(stats.best) : '—'],
      ['Worst', stats.worst !== null ? formatTime(stats.worst) : '—'],
      ['Average', stats.average !== null ? formatTime(stats.average) : '—'],
      ['Median', stats.median !== null ? formatTime(stats.median) : '—'],
      ['Std dev', stats.stdDev !== null ? formatTime(stats.stdDev) : '—'],
      ['Ao5', stats.ao5 !== null ? formatTime(stats.ao5) : '—'],
      ['Mo3', stats.mo3 !== null ? formatTime(stats.mo3) : '—'],
      ['Best Mo3', stats.bestMo3 !== null ? formatTime(stats.bestMo3) : '—'],
      ['Ao12', stats.ao12 !== null ? formatTime(stats.ao12) : '—'],
      ['Mo10', stats.mo10 !== null ? formatTime(stats.mo10) : '—'],
      ['Best Mo10', stats.bestMo10 !== null ? formatTime(stats.bestMo10) : '—'],
    ];

    this.el.statsGrid.innerHTML = rows
      .map(([k, v]) => `<div class="stat-label">${k}</div><div class="stat-value">${v}</div>`)
      .join('');
  }

  private renderTimes(): void {
    const items = [...this.solves].reverse();
    this.el.timesList.innerHTML = items
      .map((s, i) => {
        const eff = applyPenalty(s.timeMs, s.penalty);
        const label =
          eff === null
            ? 'DNF'
            : formatTime(s.penalty === '+2' ? s.timeMs : eff) + (s.penalty === '+2' ? ' (+2)' : '');
        const rank = this.solves.length - i;
        return `<li><button type="button" class="time-entry" data-id="${s.id}">${rank}. ${label}</button></li>`;
      })
      .join('');

    this.el.timesList.querySelectorAll('.time-entry').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.id!;
        const solve = this.solves.find((s) => s.id === id);
        if (solve) this.openSolveDialog(solve);
      });
    });
  }

  private openSolveDialog(solve: SolveRecord): void {
    this.activeSolveId = solve.id;
    const eff = applyPenalty(solve.timeMs, solve.penalty);
    document.getElementById('solve-dialog-time')!.textContent =
      eff === null ? 'DNF' : formatTime(solve.timeMs) + (solve.penalty !== 'none' ? ` (${solve.penalty})` : '');
    document.getElementById('solve-dialog-scramble')!.textContent = formatScrambleDisplay(
      solve.scramble,
      true,
    );
    const form = document.getElementById('solve-form') as HTMLFormElement;
    form.querySelectorAll<HTMLInputElement>('input[name="penalty"]').forEach((r) => {
      r.checked = r.value === solve.penalty;
    });
    (document.getElementById('solve-comment') as HTMLInputElement).value = solve.comment;
    this.el.solveDialog.showModal();
  }

  private bindSolveDialog(): void {
    document.getElementById('solve-delete')!.addEventListener('click', () => {
      if (this.activeSolveId) {
        this.solves = this.solves.filter((s) => s.id !== this.activeSolveId);
        saveSolves(this.solves);
        this.renderTimes();
        this.renderStats();
      }
      this.el.solveDialog.close();
    });

    document.getElementById('solve-form')!.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!this.activeSolveId) return;
      const solve = this.solves.find((s) => s.id === this.activeSolveId);
      if (!solve) return;
      const penalty = (
        document.querySelector('input[name="penalty"]:checked') as HTMLInputElement
      ).value as SolveRecord['penalty'];
      solve.penalty = penalty;
      solve.comment = (document.getElementById('solve-comment') as HTMLInputElement).value;
      saveSolves(this.solves);
      this.renderTimes();
      this.renderStats();
      this.el.solveDialog.close();
    });
  }

  private bindSettings(): void {
    const puzzle = document.getElementById('setting-puzzle') as HTMLSelectElement;
    const inspection = document.getElementById('setting-inspection') as HTMLSelectElement;
    const hidePanels = document.getElementById('setting-hide-panels') as HTMLInputElement;
    const hideTime = document.getElementById('setting-hide-time') as HTMLInputElement;
    const playSounds = document.getElementById('setting-sounds') as HTMLInputElement;
    const scrambleLen = document.getElementById('setting-scramble-len') as HTMLInputElement;
    const separate = document.getElementById('setting-separate') as HTMLInputElement;
    const theme = document.getElementById('setting-theme') as HTMLSelectElement;
    const focus = document.getElementById('setting-focus') as HTMLInputElement;

    const apply = () => {
      this.applySettings({
        puzzle: Number(puzzle.value) as PuzzleSize,
        inspection: inspection.value as AppSettings['inspection'],
        hidePanelsWhileTiming: hidePanels.checked,
        hideTimeWhileTiming: hideTime.checked,
        playSounds: playSounds.checked,
        scrambleLength: Number(scrambleLen.value) || 20,
        separateScramble: separate.checked,
        theme: theme.value as AppSettings['theme'],
        focusMode: focus.checked,
      });
    };

    [puzzle, inspection, hidePanels, hideTime, playSounds, scrambleLen, separate, theme, focus].forEach(
      (el) => el.addEventListener('change', apply),
    );
  }

  private syncSettingsForm(): void {
    (document.getElementById('setting-puzzle') as HTMLSelectElement).value = String(
      this.settings.puzzle,
    );
    (document.getElementById('setting-inspection') as HTMLSelectElement).value =
      this.settings.inspection;
    (document.getElementById('setting-hide-panels') as HTMLInputElement).checked =
      this.settings.hidePanelsWhileTiming;
    (document.getElementById('setting-hide-time') as HTMLInputElement).checked =
      this.settings.hideTimeWhileTiming;
    (document.getElementById('setting-sounds') as HTMLInputElement).checked = this.settings.playSounds;
    (document.getElementById('setting-scramble-len') as HTMLInputElement).value = String(
      this.settings.scrambleLength,
    );
    (document.getElementById('setting-separate') as HTMLInputElement).checked =
      this.settings.separateScramble;
    (document.getElementById('setting-theme') as HTMLSelectElement).value = this.settings.theme;
    (document.getElementById('setting-focus') as HTMLInputElement).checked = this.settings.focusMode;
  }

  private bindCalibration(): void {
    const tabs = document.querySelectorAll('.cal-tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        const method = (tab as HTMLElement).dataset.method!;
        document.querySelectorAll('.cal-panel').forEach((p) => p.classList.add('hidden'));
        document.getElementById(`cal-panel-${method}`)!.classList.remove('hidden');
      });
    });

    document.getElementById('cal-apply-auto')!.addEventListener('click', () => {
      this.calibration = calibrateAuto();
      saveCalibration(this.calibration);
      this.applyCalibration();
      this.updateCalStatus();
    });

    document.getElementById('cal-apply-diagonal')!.addEventListener('click', () => {
      const inches = Number((document.getElementById('cal-diagonal-input') as HTMLInputElement).value);
      if (inches > 0) {
        this.calibration = calibrateFromDiagonal(inches);
        saveCalibration(this.calibration);
        this.applyCalibration();
        this.updateCalStatus();
      }
    });

    this.el.cardSlider.addEventListener('input', () => {
      const scale = Number(this.el.cardSlider.value) / 100;
      this.el.cardScaleLabel.textContent = `${this.el.cardSlider.value}%`;
      this.updateCardOutline(scale);
    });

    document.getElementById('cal-apply-card')!.addEventListener('click', () => {
      const scale = Number(this.el.cardSlider.value) / 100;
      const widthPx = this.el.cardOutline.offsetWidth;
      this.calibration = calibrateFromCardMeasured(widthPx, scale);
      saveCalibration(this.calibration);
      this.applyCalibration();
      this.updateCalStatus();
    });
  }

  private openCalibration(): void {
    this.updateCardOutline(Number(this.el.cardSlider.value) / 100);
    this.updateCalStatus();
    this.el.calibrationDialog.showModal();
  }

  private updateCardOutline(scale = 1): void {
    const base = cardOverlaySizePx(this.calibration);
    this.el.cardOutline.style.width = `${Math.round(base.width * scale)}px`;
    this.el.cardOutline.style.height = `${Math.round(base.height * scale)}px`;
  }

  private updateCalStatus(): void {
    if (!this.calibration) {
      this.el.calStatus.textContent = 'Not calibrated';
      return;
    }
    this.el.calStatus.textContent = `Active: ${methodLabel(this.calibration.method)} (${this.calibration.confidence} confidence) — ${this.calibration.pixelsPerMm.toFixed(2)} px/mm`;
  }

  private applyCalibration(): void {
    const padPx = handPadSizePx(this.calibration);
    document.documentElement.style.setProperty('--hand-pad-size', `${padPx}px`);
    this.updateCalStatus();
  }

  private exportTimes(): void {
    const lines = this.solves.map((s) => {
      const eff = applyPenalty(s.timeMs, s.penalty);
      const t = eff === null ? 'DNF' : formatTime(eff);
      return formatExportLine(s, t);
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cube-times-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
}
