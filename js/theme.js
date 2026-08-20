/**
 * Theme Management Module
 */

import { state, saveConfig } from './state.js';

const htmlEl = document.documentElement;

export function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme) {
  const resolvedTheme = theme === 'auto' ? getSystemTheme() : theme;
  htmlEl.setAttribute('data-theme', resolvedTheme);
  htmlEl.setAttribute('data-theme-mode', theme);

  // Update settings segmented control active state if present
  const themeSelector = document.getElementById('theme-selector');
  if (themeSelector) {
    themeSelector.querySelectorAll('button').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-val') === theme);
    });
  }
}

export function toggleTheme() {
  const currentResolved = htmlEl.getAttribute('data-theme') || getSystemTheme();
  const nextTheme = currentResolved === 'dark' ? 'light' : 'dark';
  state.config.theme = nextTheme;
  saveConfig();
  applyTheme(nextTheme);
}

export function initTheme() {
  const themeToggleBtn = document.getElementById('theme-toggle');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
  }

  // Actively sync with OS/browser dark/light theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (state.config.theme === 'auto') {
      applyTheme('auto');
    }
  });
}
