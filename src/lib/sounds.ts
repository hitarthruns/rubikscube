let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function beep(freq: number, duration: number, volume = 0.15): void {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = freq;
  gain.gain.value = volume;
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export const sounds = {
  ready() {
    beep(440, 0.05);
  },
  start() {
    beep(880, 0.08);
  },
  stop() {
    beep(520, 0.1);
  },
  inspectionEnd() {
    beep(330, 0.15);
  },
  inspectionWarning() {
    beep(660, 0.06);
  },
};
