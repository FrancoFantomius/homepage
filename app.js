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
import { initShortcuts } from './js/shortcuts.js';
import { initPWA } from './js/pwa.js';
import '@francofantomius/material-components/button';
import '@francofantomius/material-components/icon-button';
import '@francofantomius/material-components/icon';
import '@francofantomius/material-components/chip';
import '@francofantomius/material-components/app-drawer';
import '@francofantomius/material-components/search-bar';
import '@francofantomius/material-components/segmented-button';
import '@francofantomius/material-components/switch';
import '@francofantomius/material-components/dialog';
import '@francofantomius/material-components/radio';

// Map local downloaded SVGs for Material Components md-icon without external fonts
const MdIcon = customElements.get('md-icon');
if (MdIcon) {
  const LOCAL_ICONS = ['apps', 'edit', 'check', 'arrow_back', 'arrow_forward', 'settings', 'add', 'close', 'delete', 'more_vert', 'open_in_new', 'refresh', 'search', 'history'];
  const origUpdated = MdIcon.prototype.updated;
  MdIcon.prototype.updated = function (changed) {
    if (origUpdated) origUpdated.call(this, changed);
    if (this.name && LOCAL_ICONS.includes(this.name)) {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
          img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            filter: var(--md-icon-filter, none);
            transition: filter var(--transition-speed, 0.25s) ease;
          }
        </style>
        <img src="./img/${this.name}.svg" alt="${this.name}" class="icon-img" />
      `;
    }
  };
}

function init() {
  loadState();
  initTheme();
  applyConfig();
  initClock();
  initBookmarks();
  initSearch();
  initModals();
  initSettings();
  initShortcuts();
  initPWA();
  initI18n(); // non-blocking / instant for default language
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
