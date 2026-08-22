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

const settingsEngineTrigger = document.getElementById('settings-engine-trigger');
const engineDialog = document.getElementById('engine-dialog');
const engineRadioGroup = document.getElementById('engine-radio-group');
const cancelEngineBtn = document.getElementById('cancel-engine-btn');
const confirmEngineBtn = document.getElementById('confirm-engine-btn');

const settingsLangTrigger = document.getElementById('settings-lang-trigger');
const languageDialog = document.getElementById('language-dialog');
const languageRadioGroup = document.getElementById('language-radio-group');
const cancelLanguageBtn = document.getElementById('cancel-language-btn');
const confirmLanguageBtn = document.getElementById('confirm-language-btn');

const toggle24h = document.getElementById('toggle-24h');
const toggleSeconds = document.getElementById('toggle-seconds');
const toggleGreeting = document.getElementById('toggle-greeting');
const toggleDate = document.getElementById('toggle-date');

const currentDateEl = document.getElementById('current-date');
const greetingText = document.getElementById('greeting-text');

export function populateEngineRadioGroup() {
  if (!engineRadioGroup) return;
  engineRadioGroup.innerHTML = '';

  const activeEngine = getCurrentSearchEngine();

  SEARCH_ENGINES.forEach(engine => {
    const radio = document.createElement('md-radio');
    radio.value = engine.id;
    radio.name = 'engine-selector';
    if (engine.id === activeEngine.id) {
      radio.checked = true;
    }

    const icon = document.createElement('img');
    icon.src = getEngineFavicon(engine);
    icon.className = 'engine-dialog-radio-icon';
    icon.width = 18;
    icon.height = 18;
    icon.alt = engine.name;
    icon.loading = 'lazy';

    const label = document.createElement('span');
    label.className = 'engine-dialog-radio-name';
    label.textContent = engine.name;

    radio.appendChild(icon);
    radio.appendChild(label);
    engineRadioGroup.appendChild(radio);
  });

  engineRadioGroup.value = activeEngine.id;
}

export function openEngineDialog() {
  if (!engineDialog) return;
  populateEngineRadioGroup();
  const activeEngine = getCurrentSearchEngine();
  if (engineRadioGroup) {
    engineRadioGroup.value = activeEngine.id;
    engineRadioGroup.querySelectorAll('md-radio').forEach(r => {
      r.checked = (r.value === activeEngine.id);
    });
  }
  if (typeof engineDialog.show === 'function') {
    engineDialog.show();
  } else {
    engineDialog.open = true;
  }
}

export function populateLanguageRadioGroup() {
  if (!languageRadioGroup) return;
  languageRadioGroup.innerHTML = '';

  const currentSetting = state.config.language || 'auto';
  const effectiveLang = currentSetting === 'auto' ? detectBrowserLanguage() : currentSetting;

  // Individual language options sorted alphabetically
  const sortedLanguages = [...SUPPORTED_LANGUAGES].sort((a, b) => {
    const labelA = a.nativeName === a.name ? a.name : `${a.nativeName} (${a.name})`;
    const labelB = b.nativeName === b.name ? b.name : `${b.nativeName} (${b.name})`;
    return labelA.localeCompare(labelB, undefined, { sensitivity: 'base' });
  });

  sortedLanguages.forEach(lang => {
    const radio = document.createElement('md-radio');
    radio.value = lang.code;
    radio.name = 'language-selector';
    if (lang.code === effectiveLang) {
      radio.checked = true;
    }
    const label = lang.nativeName === lang.name ? lang.name : `${lang.nativeName} (${lang.name})`;
    radio.textContent = label;
    languageRadioGroup.appendChild(radio);
  });

  languageRadioGroup.value = effectiveLang;
}

export function openLanguageDialog() {
  if (!languageDialog) return;
  populateLanguageRadioGroup();
  const currentSetting = state.config.language || 'auto';
  const effectiveLang = currentSetting === 'auto' ? detectBrowserLanguage() : currentSetting;
  if (languageRadioGroup) {
    languageRadioGroup.value = effectiveLang;
    languageRadioGroup.querySelectorAll('md-radio').forEach(r => {
      r.checked = (r.value === effectiveLang);
    });
  }
  if (typeof languageDialog.show === 'function') {
    languageDialog.show();
  } else {
    languageDialog.open = true;
  }
}

export function syncSettingsUI() {
  // Theme selector (Material md-segmented-button-set)
  if (themeSelector) {
    const currentTheme = state.config.theme || 'auto';
    themeSelector.querySelectorAll('md-segmented-button').forEach(btn => {
      btn.selected = (btn.value === currentTheme || btn.getAttribute('value') === currentTheme);
    });
  }

  if (toggle24h) toggle24h.selected = !!state.config.is24Hour;
  if (toggleSeconds) toggleSeconds.selected = !!state.config.showSeconds;
  if (toggleGreeting) toggleGreeting.selected = !!state.config.showGreeting;
  if (toggleDate) toggleDate.selected = !!state.config.showDate;
}

export function applyConfig() {
  applyTheme(state.config.theme);

  // Toggle widgets visibility
  if (currentDateEl) {
    currentDateEl.style.display = state.config.showDate ? '' : 'none';
  }
  if (greetingText) {
    greetingText.style.display = state.config.showGreeting ? 'inline-block' : 'none';
  }

  updateSearchEngineUI(state.config.searchEngine || 'startpage');
  updateClockAndGreeting();
  renderBookmarks();
}

export function initSettings() {
  // Re-populate and sync when language changes
  onLanguageChange(() => {
    syncSettingsUI();
    applyConfig();
  });

  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      const appDrawer = document.querySelector('md-app-drawer');
      if (appDrawer) appDrawer.open = false;
      syncSettingsUI();
      openModal(settingsModal);
    });
  }

  if (closeSettingsModalBtn) {
    closeSettingsModalBtn.addEventListener('click', () => {
      closeModal(settingsModal);
    });
  }

  // Search Engine trigger - opens dialog
  if (settingsEngineTrigger) {
    settingsEngineTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      openEngineDialog();
    });
  }

  // Search Engine Dialog buttons
  if (confirmEngineBtn) {
    confirmEngineBtn.addEventListener('click', () => {
      let selected = engineRadioGroup?.value;
      if (!selected) {
        const checkedRadio = engineRadioGroup?.querySelector('md-radio[checked]');
        if (checkedRadio) selected = checkedRadio.value;
      }
      if (selected) {
        state.config.searchEngine = selected;
        saveConfig();
        applyConfig();
        syncSettingsUI();
      }
      if (engineDialog) {
        engineDialog.close();
      }
    });
  }

  if (cancelEngineBtn) {
    cancelEngineBtn.addEventListener('click', () => {
      if (engineDialog) {
        engineDialog.close();
      }
    });
  }

  // Language trigger - opens dialog
  if (settingsLangTrigger) {
    settingsLangTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      openLanguageDialog();
    });
  }

  // Language Dialog buttons
  if (confirmLanguageBtn) {
    confirmLanguageBtn.addEventListener('click', async () => {
      let selected = languageRadioGroup?.value;
      if (!selected) {
        const checkedRadio = languageRadioGroup?.querySelector('md-radio[checked]');
        if (checkedRadio) selected = checkedRadio.value;
      }
      if (selected) {
        await setLanguage(selected);
        syncSettingsUI();
      }
      if (languageDialog) {
        languageDialog.close();
      }
    });
  }

  if (cancelLanguageBtn) {
    cancelLanguageBtn.addEventListener('click', () => {
      if (languageDialog) {
        languageDialog.close();
      }
    });
  }

  // Theme selector (Material md-segmented-button-set)
  if (themeSelector) {
    themeSelector.addEventListener('change', (e) => {
      const selectedBtn = e.detail?.target || themeSelector.querySelector('md-segmented-button[selected]');
      const val = e.detail?.value || selectedBtn?.value || selectedBtn?.getAttribute('value');
      if (val && state.config.theme !== val) {
        state.config.theme = val;
        saveConfig();
        applyConfig();
        syncSettingsUI();
      }
    });

    themeSelector.querySelectorAll('md-segmented-button').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.value || btn.getAttribute('value');
        if (val && state.config.theme !== val) {
          state.config.theme = val;
          saveConfig();
          applyConfig();
          syncSettingsUI();
        }
      });
    });
  }

  // Toggle switch listeners
  if (toggle24h) {
    toggle24h.addEventListener('change', () => {
      state.config.is24Hour = toggle24h.selected ?? toggle24h.checked;
      saveConfig();
      applyConfig();
    });
  }

  if (toggleSeconds) {
    toggleSeconds.addEventListener('change', () => {
      state.config.showSeconds = toggleSeconds.selected ?? toggleSeconds.checked;
      saveConfig();
      applyConfig();
    });
  }

  if (toggleGreeting) {
    toggleGreeting.addEventListener('change', () => {
      state.config.showGreeting = toggleGreeting.selected ?? toggleGreeting.checked;
      saveConfig();
      applyConfig();
    });
  }

  if (toggleDate) {
    toggleDate.addEventListener('change', () => {
      state.config.showDate = toggleDate.selected ?? toggleDate.checked;
      saveConfig();
      applyConfig();
    });
  }
}
