# Rubik's Cube Timer

Online Stackmat-style timer for **onlinerubikscubetimer.com** — WCA scrambles, session statistics, and three screen calibration methods.

## Run locally

```bash
npm install
npm run dev
```

## Features

- Stackmat timing (hold → release to start, hold → release to stop)
- 2×2 through 7×7 scrambles (built-in generator; tnoodle integration planned)
- Inspection modes: off, 3s, 10s, 15s
- Ao5, Ao12, Mo3, Mo10, and full session stats
- Penalties (+2, DNF) per solve
- Calibration: auto-detect, screen diagonal, credit card
- Local persistence (settings + times)
- Export / import times
- **Share settings via URL** (copy link in Settings)
- **Focus mode** (button or `F` key) — timer + scramble only
- **Light / dark theme**
- **3×3 scramble preview** (2D net visualization)
- **PWA** — installable, basic offline cache

## Build

```bash
npm run build
npm run preview
```
