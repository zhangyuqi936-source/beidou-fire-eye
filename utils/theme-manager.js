/* ═══════════════════════════════════════════════════════════════
   theme-manager.js — 主题管理器 (三态切换)
   ═══════════════════════════════════════════════════════════════ */

const STORAGE_KEY = 'theme-mode';
const THEME_ATTR = 'data-theme';

export function getCurrentTheme() {
  const stored = uni.getStorageSync(STORAGE_KEY) || 'auto';
  if (stored === 'auto') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return stored;
}

export function setTheme(mode) {
  uni.setStorageSync(STORAGE_KEY, mode);
  const theme = mode === 'auto'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : mode;
  applyTheme(theme);
}

export function applyTheme(theme) {
  document.documentElement.setAttribute(THEME_ATTR, theme);
  /* Load dark-mode.css dynamically */
  if (theme === 'dark') {
    if (!document.querySelector('link[href*="dark-mode.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/static/dark-mode.css';
      document.head.appendChild(link);
    }
  }
}

export function getThemeMode() {
  return uni.getStorageSync(STORAGE_KEY) || 'auto';
}
