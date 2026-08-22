/**
 * Theme Management Module - Dynamic Browser Palette & Material You
 */

import { state, saveConfig } from './state.js';

const htmlEl = document.documentElement;

export function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Extracts browser native AccentColor, computes relative luminance,
 * and sets optimal on-accent text contrast and theme meta tags.
 */
export function updateBrowserPalette() {
  try {
    const dummy = document.createElement('div');
    dummy.style.color = 'AccentColor';
    dummy.style.position = 'absolute';
    dummy.style.opacity = '0';
    dummy.style.pointerEvents = 'none';
    (document.body || document.documentElement).appendChild(dummy);

    const computed = window.getComputedStyle(dummy).color;
    dummy.remove();

    const match = computed.match(/\d+/g);
    if (match && match.length >= 3) {
      const [r, g, b] = match.map(Number);
      // Relative luminance calculation for WCAG contrast
      const lum = (0.299 * r + 0.587 * g + 0.114 * b);
      const onPrimary = lum > 155 ? '#000000' : '#ffffff';
      htmlEl.style.setProperty('--md-sys-color-on-primary', onPrimary);
    }
  } catch (e) {
    // Graceful fallback
  }

  // Sync PWA theme-color meta tag with active surface container
  const resolved = (htmlEl.getAttribute('data-theme') || getSystemTheme());
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', resolved === 'dark' ? '#0c0e14' : '#f5f6fa');
  }
}

export function applyTheme(theme) {
  const resolvedTheme = theme === 'auto' ? getSystemTheme() : theme;
  htmlEl.setAttribute('data-theme', resolvedTheme);
  htmlEl.setAttribute('data-theme-mode', theme);

  updateBrowserPalette();

  // Update settings segmented button active state if present
  const themeSelector = document.getElementById('theme-selector');
  if (themeSelector) {
    themeSelector.querySelectorAll('md-segmented-button').forEach(btn => {
      btn.selected = (btn.value === theme || btn.getAttribute('value') === theme);
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

  updateBrowserPalette();

  // Actively sync with OS/browser dark/light theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (state.config.theme === 'auto') {
      applyTheme('auto');
    } else {
      updateBrowserPalette();
    }
  });
}

