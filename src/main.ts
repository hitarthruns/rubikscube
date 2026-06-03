import './style.css';
import { CubeTimerApp } from './app.ts';
import { DEFAULT_SETTINGS } from './types.ts';

document.documentElement.dataset.theme = DEFAULT_SETTINGS.theme;

new CubeTimerApp();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
