/**
 * Search Engine & URL Navigation Module
 */

import { state, SEARCH_ENGINES, getCurrentSearchEngine, saveConfig } from './state.js';
import { t } from './i18n.js';

export function updateSearchEngineUI(engineId) {
  const currentEngine = SEARCH_ENGINES.find(e => e.id === engineId) || SEARCH_ENGINES[0];
  const searchBar = document.getElementById('search-bar');

  if (searchBar) {
    const placeholderText = t('search.placeholder', { engine: currentEngine.name });
    searchBar.placeholder = placeholderText;
    searchBar.setAttribute('placeholder', placeholderText);
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
  const searchBar = document.getElementById('search-bar');
  if (!searchBar) return;

  // Initialize engine UI & placeholder
  updateSearchEngineUI(state.config.searchEngine || 'startpage');

  // Handle search event from md-search-bar (fires on Enter key)
  searchBar.addEventListener('search', (e) => {
    const query = (e.detail?.value !== undefined ? e.detail.value : searchBar.value || '').trim();
    if (query) {
      executeSearch(query);
    }
  });

  // Handle trailing-icon-click if trailing action is clicked
  searchBar.addEventListener('trailing-icon-click', () => {
    const query = (searchBar.value || '').trim();
    if (query) {
      executeSearch(query);
    }
  });

  // Focus search input after component is ready
  if (typeof searchBar.focus === 'function') {
    setTimeout(() => {
      searchBar.focus();
    }, 60);
  }
}


