/**
 * Search Engine & URL Navigation Module
 */

import { state, SEARCH_ENGINES, getCurrentSearchEngine, saveConfig } from './state.js';
import { t } from './i18n.js';

const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search-btn');

export function updateSearchEngineUI(engineId) {
  const currentEngine = SEARCH_ENGINES.find(e => e.id === engineId) || SEARCH_ENGINES[0];

  if (searchInput) {
    searchInput.placeholder = t('search.placeholder', { engine: currentEngine.name });
    searchInput.name = currentEngine.queryParam;
  }

  if (searchForm) {
    searchForm.action = currentEngine.url;
  }
}

export function setSearchEngine(engineId) {
  state.config.searchEngine = engineId;
  saveConfig();
  updateSearchEngineUI(engineId);
}

export function executeSearch(query) {
  const trimmed = (query || '').trim();
  if (!trimmed) return;

  // Check if user entered a direct domain/URL (e.g., "github.com" or "localhost:3000")
  const isDomainRegex = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/i;
  if (isDomainRegex.test(trimmed) && !trimmed.includes(' ')) {
    const targetUrl = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    window.location.href = targetUrl;
    return;
  }

  const engine = getCurrentSearchEngine();
  const searchUrl = `${engine.url}?${encodeURIComponent(engine.queryParam)}=${encodeURIComponent(trimmed)}`;
  window.location.href = searchUrl;
}

export function initSearch() {
  if (!searchInput || !searchForm) return;

  // Initialize engine UI & placeholder
  updateSearchEngineUI(state.config.searchEngine || 'startpage');

  // Input listener for clear button visibility
  searchInput.addEventListener('input', () => {
    const val = searchInput.value;
    if (clearSearchBtn) {
      clearSearchBtn.classList.toggle('visible', val.length > 0);
    }
  });

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearSearchBtn.classList.remove('visible');
      searchInput.focus();
    });
  }

  // Handle form submission
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (query) {
      executeSearch(query);
    }
  });
}

