/**
 * Settings UI, Preferences & Data Management Module
 */

import { state, DEFAULT_CONFIG, DEFAULT_BOOKMARKS, SEARCH_ENGINES, getCurrentSearchEngine, getEngineFavicon, saveConfig, saveBookmarks } from './state.js';
import { openModal, closeModal } from './modal.js';
import { applyTheme } from './theme.js';
import { updateClockAndGreeting } from './clock.js';
import { renderBookmarks } from './bookmarks.js';
import { updateSearchEngineUI } from './search.js';
import { SUPPORTED_LANGUAGES, setLanguage, t, onLanguageChange, getResolvedLanguage, detectBrowserLanguage } from './i18n.js';

const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsModalBtn = document.getElementById('close-settings-modal');
const themeSelector = document.getElementById('theme-selector');

const settingsEngineDropdown = document.getElementById('settings-engine-dropdown');
const settingsEngineTrigger = document.getElementById('settings-engine-trigger');
const settingsEngineIcon = document.getElementById('settings-engine-icon');
const settingsEngineName = document.getElementById('settings-engine-name');
const settingsEngineMenu = document.getElementById('settings-engine-menu');

const settingsLangDropdown = document.getElementById('settings-lang-dropdown');
const settingsLangTrigger = document.getElementById('settings-lang-trigger');
const settingsLangName = document.getElementById('settings-lang-name');
const settingsLangMenu = document.getElementById('settings-lang-menu');

const toggleGlow = document.getElementById('toggle-glow');
const toggle24h = document.getElementById('toggle-24h');
const toggleSeconds = document.getElementById('toggle-seconds');
const toggleGreeting = document.getElementById('toggle-greeting');
const toggleDate = document.getElementById('toggle-date');

const bgEffects = document.querySelector('.bg-effects');
const currentDateEl = document.getElementById('current-date');
const greetingText = document.getElementById('greeting-text');

export function closeSettingsEngineDropdown() {
  if (settingsEngineDropdown) {
    settingsEngineDropdown.classList.remove('open');
    if (settingsEngineTrigger) {
      settingsEngineTrigger.setAttribute('aria-expanded', 'false');
    }
    if (settingsEngineMenu) {
      settingsEngineMenu.setAttribute('aria-hidden', 'true');
    }
  }
}

export function closeSettingsLangDropdown() {
  if (settingsLangDropdown) {
    settingsLangDropdown.classList.remove('open');
    if (settingsLangTrigger) {
      settingsLangTrigger.setAttribute('aria-expanded', 'false');
    }
    if (settingsLangMenu) {
      settingsLangMenu.setAttribute('aria-hidden', 'true');
    }
  }
}

export function populateSettingsEngineDropdown() {
  if (!settingsEngineMenu) return;
  settingsEngineMenu.innerHTML = '';

  const activeEngine = getCurrentSearchEngine();

  SEARCH_ENGINES.forEach(engine => {
    const isSelected = engine.id === activeEngine.id;
    const item = document.createElement('button');
    item.type = 'button';
    item.className = `custom-dropdown-item ${isSelected ? 'active' : ''}`;
    item.setAttribute('data-engine-id', engine.id);
    item.setAttribute('role', 'option');
    item.setAttribute('aria-selected', isSelected ? 'true' : 'false');

    item.innerHTML = `
      <img src="${getEngineFavicon(engine)}" class="custom-dropdown-item-icon" width="16" height="16" alt="${engine.name}" loading="lazy">
      <span class="custom-dropdown-item-name">${engine.name}</span>
      <svg class="custom-dropdown-item-check" viewBox="0 -960 960 960" width="16" height="16" fill="currentColor">
        <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/>
      </svg>
    `;

    item.addEventListener('click', (e) => {
      e.stopPropagation();
      state.config.searchEngine = engine.id;
      saveConfig();
      applyConfig();
      syncSettingsUI();
      closeSettingsEngineDropdown();
    });

    settingsEngineMenu.appendChild(item);
  });
}

export function populateSettingsLangDropdown() {
  if (!settingsLangMenu) return;
  settingsLangMenu.innerHTML = '';

  const currentLangSetting = state.config.language || 'auto';

  // 1. "Auto (Language)" option
  const autoOption = document.createElement('button');
  const isAutoSelected = currentLangSetting === 'auto';
  autoOption.type = 'button';
  autoOption.className = `custom-dropdown-item ${isAutoSelected ? 'active' : ''}`;
  autoOption.setAttribute('data-lang-code', 'auto');
  autoOption.setAttribute('role', 'option');
  autoOption.setAttribute('aria-selected', isAutoSelected ? 'true' : 'false');

  const detectedCode = detectBrowserLanguage();
  const detectedLangObj = SUPPORTED_LANGUAGES.find(l => l.code === detectedCode) || SUPPORTED_LANGUAGES[0];
  const autoLabel = t('settings.languageAuto', { lang: detectedLangObj.nativeName });

  autoOption.innerHTML = `
    <span class="custom-dropdown-item-name">${autoLabel}</span>
    <svg class="custom-dropdown-item-check" viewBox="0 -960 960 960" width="16" height="16" fill="currentColor">
      <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/>
    </svg>
  `;

  autoOption.addEventListener('click', async (e) => {
    e.stopPropagation();
    await setLanguage('auto');
    syncSettingsUI();
    closeSettingsLangDropdown();
  });

  settingsLangMenu.appendChild(autoOption);

  // 2. Individual language options sorted alphabetically
  const sortedLanguages = [...SUPPORTED_LANGUAGES].sort((a, b) => {
    const labelA = a.nativeName === a.name ? a.name : `${a.nativeName} (${a.name})`;
    const labelB = b.nativeName === b.name ? b.name : `${b.nativeName} (${b.name})`;
    return labelA.localeCompare(labelB, undefined, { sensitivity: 'base' });
  });

  sortedLanguages.forEach(lang => {
    const isSelected = currentLangSetting === lang.code;
    const item = document.createElement('button');
    item.type = 'button';
    item.className = `custom-dropdown-item ${isSelected ? 'active' : ''}`;
    item.setAttribute('data-lang-code', lang.code);
    item.setAttribute('role', 'option');
    item.setAttribute('aria-selected', isSelected ? 'true' : 'false');

    const label = lang.nativeName === lang.name ? lang.name : `${lang.nativeName} (${lang.name})`;

    item.innerHTML = `
      <span class="custom-dropdown-item-name">${label}</span>
      <svg class="custom-dropdown-item-check" viewBox="0 -960 960 960" width="16" height="16" fill="currentColor">
        <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/>
      </svg>
    `;

    item.addEventListener('click', async (e) => {
      e.stopPropagation();
      await setLanguage(lang.code);
      syncSettingsUI();
      closeSettingsLangDropdown();
    });

    settingsLangMenu.appendChild(item);
  });
}

export function syncSettingsUI() {
  // Theme selector
  if (themeSelector) {
    themeSelector.querySelectorAll('button').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-val') === state.config.theme);
    });
  }

  // Engine dropdown trigger & active state
  const currentEngine = getCurrentSearchEngine();
  if (settingsEngineIcon) {
    settingsEngineIcon.src = getEngineFavicon(currentEngine);
    settingsEngineIcon.alt = currentEngine.name;
  }
  if (settingsEngineName) {
    settingsEngineName.textContent = currentEngine.name;
  }

  if (settingsEngineMenu) {
    const items = settingsEngineMenu.querySelectorAll('.custom-dropdown-item');
    items.forEach(item => {
      const isSelected = item.getAttribute('data-engine-id') === currentEngine.id;
      item.classList.toggle('active', isSelected);
      item.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });
  }

  // Language dropdown trigger & active state
  const langConfig = state.config.language || 'auto';
  if (settingsLangName) {
    if (langConfig === 'auto') {
      const detectedCode = detectBrowserLanguage();
      const detectedLangObj = SUPPORTED_LANGUAGES.find(l => l.code === detectedCode) || SUPPORTED_LANGUAGES[0];
      settingsLangName.textContent = t('settings.languageAuto', { lang: detectedLangObj.nativeName });
    } else {
      const activeLang = SUPPORTED_LANGUAGES.find(l => l.code === langConfig);
      settingsLangName.textContent = activeLang ? activeLang.nativeName : langConfig;
    }
  }

  if (settingsLangMenu) {
    const items = settingsLangMenu.querySelectorAll('.custom-dropdown-item');
    items.forEach(item => {
      const isSelected = item.getAttribute('data-lang-code') === langConfig;
      item.classList.toggle('active', isSelected);
      item.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });
  }

  if (toggleGlow) toggleGlow.checked = state.config.showGlow;
  if (toggle24h) toggle24h.checked = state.config.is24Hour;
  if (toggleSeconds) toggleSeconds.checked = state.config.showSeconds;
  if (toggleGreeting) toggleGreeting.checked = state.config.showGreeting;
  if (toggleDate) toggleDate.checked = state.config.showDate;
}

export function applyConfig() {
  applyTheme(state.config.theme);

  // Toggle widgets visibility
  if (bgEffects) {
    bgEffects.classList.toggle('hidden', !state.config.showGlow);
  }
  if (currentDateEl) {
    currentDateEl.style.display = state.config.showDate ? 'inline-block' : 'none';
  }
  if (greetingText) {
    greetingText.style.display = state.config.showGreeting ? 'inline-block' : 'none';
  }

  updateSearchEngineUI(state.config.searchEngine || 'startpage');
  updateClockAndGreeting();
  renderBookmarks();
}

export function initSettings() {
  populateSettingsEngineDropdown();
  populateSettingsLangDropdown();

  // Re-populate and sync when language changes
  onLanguageChange(() => {
    populateSettingsEngineDropdown();
    populateSettingsLangDropdown();
    syncSettingsUI();
    applyConfig();
  });

  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      const appsPopover = document.getElementById('apps-popover');
      if (appsPopover) appsPopover.classList.remove('open');
      syncSettingsUI();
      openModal(settingsModal);
    });
  }

  if (closeSettingsModalBtn) {
    closeSettingsModalBtn.addEventListener('click', () => {
      closeSettingsEngineDropdown();
      closeSettingsLangDropdown();
      closeModal(settingsModal);
    });
  }

  // Search Engine custom dropdown trigger
  if (settingsEngineTrigger && settingsEngineDropdown) {
    settingsEngineTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      closeSettingsLangDropdown();
      const isOpen = settingsEngineDropdown.classList.toggle('open');
      settingsEngineTrigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if (settingsEngineMenu) {
        settingsEngineMenu.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
      }
    });
  }

  // Language custom dropdown trigger
  if (settingsLangTrigger && settingsLangDropdown) {
    settingsLangTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      closeSettingsEngineDropdown();
      const isOpen = settingsLangDropdown.classList.toggle('open');
      settingsLangTrigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if (settingsLangMenu) {
        settingsLangMenu.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
      }
    });
  }

  // Close dropdowns on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#settings-engine-dropdown')) {
      closeSettingsEngineDropdown();
    }
    if (!e.target.closest('#settings-lang-dropdown')) {
      closeSettingsLangDropdown();
    }
  });

  // Theme selector segmented control
  if (themeSelector) {
    themeSelector.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        state.config.theme = btn.getAttribute('data-val');
        saveConfig();
        applyConfig();
        syncSettingsUI();
      });
    });
  }

  // Toggle switch listeners
  if (toggleGlow) {
    toggleGlow.addEventListener('change', () => {
      state.config.showGlow = toggleGlow.checked;
      saveConfig();
      applyConfig();
    });
  }

  if (toggle24h) {
    toggle24h.addEventListener('change', () => {
      state.config.is24Hour = toggle24h.checked;
      saveConfig();
      applyConfig();
    });
  }

  if (toggleSeconds) {
    toggleSeconds.addEventListener('change', () => {
      state.config.showSeconds = toggleSeconds.checked;
      saveConfig();
      applyConfig();
    });
  }

  if (toggleGreeting) {
    toggleGreeting.addEventListener('change', () => {
      state.config.showGreeting = toggleGreeting.checked;
      saveConfig();
      applyConfig();
    });
  }

  if (toggleDate) {
    toggleDate.addEventListener('change', () => {
      state.config.showDate = toggleDate.checked;
      saveConfig();
      applyConfig();
    });
  }
}
