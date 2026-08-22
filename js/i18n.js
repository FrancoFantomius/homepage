/**
 * Internationalization (i18n) Module
 * JSON-based localized dictionaries with browser auto-detection & fallback to English
 */

import { state, saveConfig } from './state.js';

export const SUPPORTED_LANGUAGES = [
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' }
];

export const DEFAULT_LANGUAGE = 'en';

const DEFAULT_EN_TRANSLATIONS = {
  general: {
    pageTitle: "New Tab",
    today: "Today"
  },
  greetings: {
    morning: "Good morning",
    afternoon: "Good afternoon",
    evening: "Good evening",
    night: "Good night",
    welcome: "Welcome"
  },
  search: {
    placeholder: "Search on {engine}",
    clear: "Clear Search",
    submit: "Search"
  },
  bookmarks: {
    quickAccess: "Quick Access",
    addShortcut: "Add Shortcut",
    editShortcut: "Edit Shortcut",
    edit: "Edit",
    delete: "Delete",
    title: "Title",
    titlePlaceholder: "e.g. Wikipedia",
    url: "URL",
    urlPlaceholder: "https://wikipedia.org",
    iconUrl: "Icon URL (optional)",
    iconUrlPlaceholder: "Leave empty for auto-favicon",
    cancel: "Cancel",
    save: "Save Shortcut",
    saveChanges: "Save Changes",
    shortcut: "Shortcut",
    optionsAria: "Options for {title}"
  },
  settings: {
    title: "Settings",
    close: "Close",
    general: "General & Language",
    language: "Language",
    languageAuto: "Auto ({lang})",
    changeLanguage: "Change language",
    changeSearchEngine: "Change search engine",
    cancel: "Cancel",
    appearance: "Appearance & Theme",
    themeMode: "Theme Mode",
    themeSystem: "System",
    themeDark: "Dark",
    themeLight: "Light",
    searchHeader: "Search",
    searchEngine: "Search Engine",
    clockHeader: "Clock & Widgets",
    clock24h: "24-Hour Clock",
    clockSeconds: "Show Seconds",
    greeting: "Show Greeting",
    dateHeader: "Show Date Header"
  },
  apps: {
    title: "My Apps",
    searchPlaceholder: "Search apps...",
    launch: "Launch",
    viewSource: "Source",
    refresh: "Refresh Apps",
    noResults: "No apps found matching your search",
    allRepos: "All Repositories",
    countLabel: "apps"
  },
  footer: {
    focusSearch: "Focus search",
    launchShortcut: "Launch shortcut"
  },
  header: {
    themeToggle: "Toggle Theme",
    themeToggleAria: "Toggle Light/Dark Theme",
    apps: "My Apps",
    appsAria: "Open App Drawer",
    settings: "Settings",
    settingsAria: "Open Settings"
  }
};

const embeddedTranslations = (typeof __EMBEDDED_TRANSLATIONS__ !== 'undefined' && __EMBEDDED_TRANSLATIONS__)
  || (typeof window !== 'undefined' && window.__EMBEDDED_TRANSLATIONS__)
  || {};

const translationsCache = {
  en: DEFAULT_EN_TRANSLATIONS,
  ...embeddedTranslations
};
let currentLanguage = DEFAULT_LANGUAGE;
const changeListeners = [];

/**
 * Detect user's browser language with fallback to English
 */
export function detectBrowserLanguage() {
  const browserLangs = navigator.languages && navigator.languages.length > 0
    ? navigator.languages
    : [navigator.language || navigator.userLanguage || 'en'];

  for (const lang of browserLangs) {
    if (!lang) continue;
    const cleanLang = lang.toLowerCase().split('-')[0];
    const match = SUPPORTED_LANGUAGES.find(l => l.code === cleanLang);
    if (match) {
      return match.code;
    }
  }

  return DEFAULT_LANGUAGE;
}

/**
 * Get active resolved language code (e.g. 'en', 'it')
 */
export function getResolvedLanguage() {
  const userChoice = state.config?.language;
  if (!userChoice || userChoice === 'auto') {
    return detectBrowserLanguage();
  }
  const match = SUPPORTED_LANGUAGES.find(l => l.code === userChoice);
  return match ? match.code : DEFAULT_LANGUAGE;
}

/**
 * Fetch a language JSON dictionary from langs/ folder
 */
async function loadTranslationFile(langCode) {
  if (translationsCache[langCode]) {
    return translationsCache[langCode];
  }

  try {
    const response = await fetch(`langs/${langCode}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load translation: ${langCode}`);
    }
    const data = await response.json();
    translationsCache[langCode] = data;
    return data;
  } catch (err) {
    console.warn(`Could not load translations for "${langCode}":`, err);
    return null;
  }
}

/**
 * Initialize and load dictionary for current configuration
 */
export async function initI18n() {
  const resolved = getResolvedLanguage();
  currentLanguage = resolved;

  if (resolved !== DEFAULT_LANGUAGE && !translationsCache[resolved]) {
    await loadTranslationFile(resolved);
  }

  applyTranslations();
  return currentLanguage;
}

/**
 * Get translation string by dot-notation key (e.g., 'settings.appearance')
 * Fallback to English and replace `{key}` placeholder tokens.
 */
export function t(key, params = {}) {
  if (!key) return '';

  const getNested = (obj, path) => {
    if (!obj) return null;
    return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : null), obj);
  };

  let str = getNested(translationsCache[currentLanguage], key);

  if (str === null || str === undefined) {
    str = getNested(translationsCache[DEFAULT_LANGUAGE], key);
  }

  if (str === null || str === undefined) {
    // Return the last key part as readable fallback
    return key.split('.').pop();
  }

  // Replace variable placeholders like {engine} or {title}
  if (typeof str === 'string' && params && typeof params === 'object') {
    Object.keys(params).forEach(param => {
      str = str.replaceAll(`{${param}}`, params[param]);
    });
  }

  return str;
}

/**
 * Apply translations to DOM elements with data-i18n* attributes
 */
export function applyTranslations() {
  document.documentElement.lang = currentLanguage;

  // textContent
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });

  // placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key);
  });

  // title
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    el.title = t(key);
  });

  // aria-label
  document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
    const key = el.getAttribute('data-i18n-aria-label');
    el.setAttribute('aria-label', t(key));
  });

  // headline attribute
  document.querySelectorAll('[data-i18n-headline]').forEach(el => {
    const key = el.getAttribute('data-i18n-headline');
    el.setAttribute('headline', t(key));
  });

  // label attribute (e.g. md-segmented-button, md-button, etc.)
  document.querySelectorAll('[data-i18n-label]').forEach(el => {
    const key = el.getAttribute('data-i18n-label');
    const translated = t(key);
    el.setAttribute('label', translated);
    if ('label' in el) {
      el.label = translated;
    }
  });

  // innerHTML
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    el.innerHTML = t(key);
  });

  // Document page title
  const translatedTitle = t('general.pageTitle');
  if (translatedTitle) {
    document.title = translatedTitle;
  }
}

/**
 * Register callback when language changes
 */
export function onLanguageChange(callback) {
  if (typeof callback === 'function') {
    changeListeners.push(callback);
  }
}

/**
 * Change language dynamically, load dictionary, and notify listeners
 */
export async function setLanguage(langCode) {
  state.config.language = langCode;
  saveConfig();

  const resolved = getResolvedLanguage();
  currentLanguage = resolved;

  if (!translationsCache[resolved]) {
    await loadTranslationFile(resolved);
  }

  applyTranslations();

  changeListeners.forEach(fn => {
    try {
      fn(currentLanguage);
    } catch (e) {
      console.error('Error in language change listener:', e);
    }
  });
}

export function getCurrentLanguageCode() {
  return currentLanguage;
}
