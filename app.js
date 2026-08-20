/**
 * Modern Fast Browser Homepage - Main Application Entry Point
 * Pure ES6 Modules - Zero Dependencies
 */

import { loadState } from './js/state.js';
import { initI18n } from './js/i18n.js';
import { initTheme } from './js/theme.js';
import { initClock } from './js/clock.js';
import { initBookmarks } from './js/bookmarks.js';
import { initSearch } from './js/search.js';
import { initModals } from './js/modal.js';
import { initSettings, applyConfig } from './js/settings.js';
import { initAppsDrawer } from './js/apps.js';
import { initShortcuts } from './js/shortcuts.js';
import { initPWA } from './js/pwa.js';

function init() {
  loadState();
  initTheme();
  applyConfig();
  initClock();
  initBookmarks();
  initSearch();
  initModals();
  initSettings();
  initAppsDrawer();
  initShortcuts();
  initPWA();
  initI18n(); // non-blocking / instant for default language
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
