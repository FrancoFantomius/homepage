/**
 * Search Engine, Autosuggest & URL Navigation Module
 */

import { state, SEARCH_ENGINES, getCurrentSearchEngine, getEngineFavicon, saveConfig } from './state.js';
import { t } from './i18n.js';

let activeSuggestionIndex = -1;
let currentSuggestions = [];
let suggestDebounceTimer = null;
let currentScriptEl = null;
let currentAbortController = null;

const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search-btn');
const searchSuggestions = document.getElementById('search-suggestions');

export function hideSuggestions() {
  if (!searchSuggestions) return;
  searchSuggestions.classList.remove('visible');
  searchSuggestions.setAttribute('aria-hidden', 'true');
  searchSuggestions.innerHTML = '';
  activeSuggestionIndex = -1;
  currentSuggestions = [];
}

export function showSuggestionsDropdown() {
  if (!searchSuggestions) return;
  if (currentSuggestions.length > 0) {
    searchSuggestions.classList.add('visible');
    searchSuggestions.setAttribute('aria-hidden', 'false');
  }
}

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

export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function highlightMatch(fullText, query) {
  if (!query) return escapeHtml(fullText);
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  return escapeHtml(fullText).replace(regex, '<strong>$1</strong>');
}

export function selectSuggestion(index, submit = false) {
  if (index < 0 || index >= currentSuggestions.length) return;
  const item = currentSuggestions[index];

  if (item.type === 'bookmark') {
    window.location.href = item.url;
    hideSuggestions();
    return;
  }

  if (searchInput) {
    searchInput.value = item.text;
  }
  if (clearSearchBtn) {
    clearSearchBtn.classList.add('visible');
  }
  hideSuggestions();

  if (submit && searchForm) {
    executeSearch(item.text);
  }
}

export function renderSuggestions(items, query) {
  if (!searchSuggestions) return;
  currentSuggestions = items;
  activeSuggestionIndex = -1;
  searchSuggestions.innerHTML = '';

  if (!items || items.length === 0) {
    hideSuggestions();
    return;
  }

  items.forEach((item, index) => {
    const el = document.createElement('div');
    el.className = 'suggestion-item';
    el.setAttribute('data-index', index);

    if (item.type === 'bookmark') {
      const badgeText = item.shortcutNum ? `Alt + ${item.shortcutNum}` : t('bookmarks.shortcut');
      el.innerHTML = `
        <div class="suggestion-icon">
          <img src="img/bookmark.svg" class="icon-img" width="16" height="16" alt="Bookmark">
        </div>
        <span class="suggestion-text">${highlightMatch(item.text, query)} <span style="font-size: 0.8em; color: var(--text-muted);">(${escapeHtml(item.url)})</span></span>
        <span class="suggestion-badge">${badgeText}</span>
      `;
    } else {
      el.innerHTML = `
        <div class="suggestion-icon">
          <img src="img/search.svg" class="icon-img" width="16" height="16" alt="Search">
        </div>
        <span class="suggestion-text">${highlightMatch(item.text, query)}</span>
      `;
    }

    el.addEventListener('mousedown', (e) => {
      e.preventDefault();
      selectSuggestion(index, true);
    });

    searchSuggestions.appendChild(el);
  });

  showSuggestionsDropdown();
}

/**
 * Fetch autosuggestions based on the currently active search engine
 */
export function fetchAutosuggest(query) {
  if (!state.config.showSuggestions || !query || query.trim().length === 0) {
    hideSuggestions();
    return;
  }

  const trimmed = query.trim();
  const trimmedLower = trimmed.toLowerCase();

  // 1. Find matching bookmarks
  const matchingBookmarks = state.bookmarks
    .map((b, originalIndex) => ({
      bookmark: b,
      shortcutNum: originalIndex < 9 ? originalIndex + 1 : null
    }))
    .filter(item =>
      item.bookmark.title.toLowerCase().includes(trimmedLower) ||
      item.bookmark.url.toLowerCase().includes(trimmedLower)
    )
    .slice(0, 3)
    .map(item => ({
      type: 'bookmark',
      text: item.bookmark.title,
      url: item.bookmark.url,
      shortcutNum: item.shortcutNum
    }));

  // 2. Clean up previous JSONP script / abort controller
  if (currentScriptEl && currentScriptEl.parentNode) {
    currentScriptEl.remove();
    currentScriptEl = null;
  }
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }

  const activeEngine = getCurrentSearchEngine();

  const handleSuggestionResults = (results) => {
    const webSuggestions = (results || [])
      .slice(0, 6)
      .map(text => ({
        type: 'search',
        text: typeof text === 'string' ? text : String(text)
      }));

    const combined = [...matchingBookmarks];
    webSuggestions.forEach(ws => {
      if (!combined.some(c => c.text.toLowerCase() === ws.text.toLowerCase())) {
        combined.push(ws);
      }
    });

    renderSuggestions(combined, query);
  };

  // Helper for JSONP fallback (using DuckDuckGo Suggestions)
  const executeFallbackJsonp = () => {
    const fallbackCallback = 'hp_fallback_cb_' + Date.now();
    window[fallbackCallback] = function (data) {
      delete window[fallbackCallback];
      if (currentScriptEl && currentScriptEl.parentNode) {
        currentScriptEl.remove();
        currentScriptEl = null;
      }
      const suggestions = Array.isArray(data)
        ? data.map(item => (typeof item === 'string' ? item : item.phrase))
        : [];
      handleSuggestionResults(suggestions);
    };

    const script = document.createElement('script');
    script.src = `https://duckduckgo.com/ac/?q=${encodeURIComponent(trimmed)}&callback=${fallbackCallback}`;
    script.onerror = () => {
      delete window[fallbackCallback];
      if (matchingBookmarks.length > 0) {
        renderSuggestions(matchingBookmarks, query);
      } else {
        hideSuggestions();
      }
    };
    currentScriptEl = script;
    document.body.appendChild(script);
  };

  // 3. Engine-specific suggestions
  if (activeEngine.id === 'google') {
    const callbackName = 'hp_google_cb_' + Date.now();
    window[callbackName] = function (data) {
      delete window[callbackName];
      if (currentScriptEl && currentScriptEl.parentNode) {
        currentScriptEl.remove();
        currentScriptEl = null;
      }
      const list = data && data[1] ? data[1] : [];
      handleSuggestionResults(list);
    };

    const script = document.createElement('script');
    script.src = `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(trimmed)}&callback=${callbackName}`;
    script.onerror = () => {
      delete window[callbackName];
      if (matchingBookmarks.length > 0) renderSuggestions(matchingBookmarks, query);
      else hideSuggestions();
    };
    currentScriptEl = script;
    document.body.appendChild(script);
  } else if (activeEngine.id === 'duckduckgo') {
    const callbackName = 'hp_ddg_cb_' + Date.now();
    window[callbackName] = function (data) {
      delete window[callbackName];
      if (currentScriptEl && currentScriptEl.parentNode) {
        currentScriptEl.remove();
        currentScriptEl = null;
      }
      const list = Array.isArray(data)
        ? data.map(item => (typeof item === 'string' ? item : item.phrase))
        : [];
      handleSuggestionResults(list);
    };

    const script = document.createElement('script');
    script.src = `https://duckduckgo.com/ac/?q=${encodeURIComponent(trimmed)}&callback=${callbackName}`;
    script.onerror = () => {
      delete window[callbackName];
      executeFallbackJsonp();
    };
    currentScriptEl = script;
    document.body.appendChild(script);
  } else if (activeEngine.id === 'bing') {
    const callbackName = 'hp_bing_cb_' + Date.now();
    window[callbackName] = function (data) {
      delete window[callbackName];
      if (currentScriptEl && currentScriptEl.parentNode) {
        currentScriptEl.remove();
        currentScriptEl = null;
      }
      let list = [];
      if (data && data.AS && data.AS.Results && data.AS.Results[0] && data.AS.Results[0].Suggests) {
        list = data.AS.Results[0].Suggests.map(s => s.Txt);
      }
      handleSuggestionResults(list);
    };

    const script = document.createElement('script');
    script.src = `https://api.bing.com/qsonhs.aspx?q=${encodeURIComponent(trimmed)}&cb=${callbackName}`;
    script.onerror = () => {
      delete window[callbackName];
      executeFallbackJsonp();
    };
    currentScriptEl = script;
    document.body.appendChild(script);
  } else if (activeEngine.id === 'qwant') {
    currentAbortController = new AbortController();
    fetch(`https://api.qwant.com/v3/suggest?q=${encodeURIComponent(trimmed)}&client=opensearch`, {
      signal: currentAbortController.signal
    })
      .then(res => res.json())
      .then(data => {
        const list = data && data[1] ? data[1] : [];
        handleSuggestionResults(list);
      })
      .catch(() => {
        executeFallbackJsonp();
      });
  } else if (activeEngine.id === 'ecosia') {
    currentAbortController = new AbortController();
    fetch(`https://ac.ecosia.org/autocomplete?q=${encodeURIComponent(trimmed)}&type=list`, {
      signal: currentAbortController.signal
    })
      .then(res => res.json())
      .then(data => {
        const list = data && data[1] ? data[1] : [];
        handleSuggestionResults(list);
      })
      .catch(() => {
        executeFallbackJsonp();
      });
  } else if (activeEngine.id === 'brave') {
    currentAbortController = new AbortController();
    fetch(`https://search.brave.com/api/suggest?q=${encodeURIComponent(trimmed)}`, {
      signal: currentAbortController.signal
    })
      .then(res => res.json())
      .then(data => {
        const list = data && data[1] ? data[1] : [];
        handleSuggestionResults(list);
      })
      .catch(() => {
        executeFallbackJsonp();
      });
  } else {
    // Startpage or generic
    currentAbortController = new AbortController();
    fetch(`https://www.startpage.com/suggestions?q=${encodeURIComponent(trimmed)}`, {
      signal: currentAbortController.signal
    })
      .then(res => res.json())
      .then(data => {
        let list = [];
        if (data && data.suggestions) {
          list = data.suggestions.map(s => s.text);
        } else if (data && data[1]) {
          list = data[1];
        }
        handleSuggestionResults(list);
      })
      .catch(() => {
        executeFallbackJsonp();
      });
  }
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

  // Input listener with debounce for autosuggest
  searchInput.addEventListener('input', () => {
    const val = searchInput.value;
    if (clearSearchBtn) {
      clearSearchBtn.classList.toggle('visible', val.length > 0);
    }

    clearTimeout(suggestDebounceTimer);
    if (!val.trim() || !state.config.showSuggestions) {
      hideSuggestions();
      return;
    }

    suggestDebounceTimer = setTimeout(() => {
      fetchAutosuggest(val);
    }, 120);
  });

  // Keyboard navigation in search suggestions
  searchInput.addEventListener('keydown', (e) => {
    if (!searchSuggestions || !searchSuggestions.classList.contains('visible') || currentSuggestions.length === 0) {
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeSuggestionIndex = (activeSuggestionIndex + 1) % currentSuggestions.length;
      updateSuggestionActiveState();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeSuggestionIndex = (activeSuggestionIndex - 1 + currentSuggestions.length) % currentSuggestions.length;
      updateSuggestionActiveState();
    } else if (e.key === 'Enter') {
      if (activeSuggestionIndex >= 0) {
        e.preventDefault();
        selectSuggestion(activeSuggestionIndex, true);
      }
    } else if (e.key === 'Escape') {
      hideSuggestions();
    }
  });

  function updateSuggestionActiveState() {
    if (!searchSuggestions) return;
    const items = searchSuggestions.querySelectorAll('.suggestion-item');
    items.forEach((item, idx) => {
      item.classList.toggle('active', idx === activeSuggestionIndex);
    });
    if (activeSuggestionIndex >= 0 && activeSuggestionIndex < currentSuggestions.length) {
      const activeItem = currentSuggestions[activeSuggestionIndex];
      if (activeItem.type === 'search') {
        searchInput.value = activeItem.text;
      }
    }
  }

  // Hide suggestions on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-input-wrapper')) {
      hideSuggestions();
    }
  });

  // Close dropdown on Escape key globally
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideSuggestions();
    }
  });

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearSearchBtn.classList.remove('visible');
      hideSuggestions();
      searchInput.focus();
    });
  }

  // Handle form submission
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    hideSuggestions();
    const query = searchInput.value.trim();
    if (query) {
      executeSearch(query);
    }
  });
}
