/**
 * State Management & Local Storage Persistence
 */

export const DEFAULT_BOOKMARKS = [
  { id: '1', title: 'YouTube', url: 'https://youtube.com', icon: '' },
  { id: '2', title: 'Wikipedia', url: 'https://wikipedia.org', icon: '' },
  { id: '3', title: 'Reddit', url: 'https://reddit.com', icon: '' },
  { id: '4', title: 'Amazon', url: 'https://amazon.com', icon: '' },
  { id: '5', title: 'Netflix', url: 'https://netflix.com', icon: '' },
  { id: '6', title: 'Instagram', url: 'https://instagram.com', icon: '' },
  { id: '7', title: 'X', url: 'https://x.com', icon: '' },
  { id: '8', title: 'Spotify', url: 'https://open.spotify.com', icon: '' }
];

export const SEARCH_ENGINES = [
  {
    id: 'startpage',
    name: 'Startpage',
    url: 'https://www.startpage.com/do/dsearch',
    queryParam: 'query',
    domain: 'startpage.com',
    placeholder: 'Search on Startpage'
  },
  {
    id: 'google',
    name: 'Google',
    url: 'https://www.google.com/search',
    queryParam: 'q',
    domain: 'google.com',
    placeholder: 'Search on Google'
  },
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    url: 'https://duckduckgo.com/',
    queryParam: 'q',
    domain: 'duckduckgo.com',
    placeholder: 'Search on DuckDuckGo'
  },
  {
    id: 'brave',
    name: 'Brave Search',
    url: 'https://search.brave.com/search',
    queryParam: 'q',
    domain: 'search.brave.com',
    placeholder: 'Search on Brave'
  },
  {
    id: 'bing',
    name: 'Bing',
    url: 'https://www.bing.com/search',
    queryParam: 'q',
    domain: 'bing.com',
    placeholder: 'Search on Bing'
  },
  {
    id: 'ecosia',
    name: 'Ecosia',
    url: 'https://www.ecosia.org/search',
    queryParam: 'q',
    domain: 'ecosia.org',
    placeholder: 'Search on Ecosia'
  },
  {
    id: 'qwant',
    name: 'Qwant',
    url: 'https://www.qwant.com/',
    queryParam: 'q',
    domain: 'qwant.com',
    placeholder: 'Search on Qwant'
  }
];

export function getEngineFavicon(engine) {
  return `https://icons.duckduckgo.com/ip3/${encodeURIComponent(engine.domain)}.ico`;
}

export const DEFAULT_CONFIG = {
  theme: 'auto', // 'auto' (syncs with browser/OS), 'dark', or 'light'
  language: 'auto', // 'auto' (browser language detection), or specific code e.g. 'en', 'it'
  searchEngine: 'startpage',
  is24Hour: true,
  showSeconds: false,
  showGreeting: true,
  showDate: true,
  disablePwaOnLocalhost: true
};

export const state = {
  config: { ...DEFAULT_CONFIG },
  bookmarks: [...DEFAULT_BOOKMARKS]
};

export function getCurrentSearchEngine() {
  const engineId = state.config.searchEngine || 'startpage';
  return SEARCH_ENGINES.find(e => e.id === engineId) || SEARCH_ENGINES[0];
}

export function loadState() {
  try {
    const savedConfig = localStorage.getItem('hp_config');
    if (savedConfig) {
      state.config = { ...DEFAULT_CONFIG, ...JSON.parse(savedConfig) };
    }
    const savedBookmarks = localStorage.getItem('hp_bookmarks');
    if (savedBookmarks) {
      state.bookmarks = JSON.parse(savedBookmarks);
    }
  } catch (e) {
    console.warn('Failed to parse localStorage data:', e);
  }
}

export function saveConfig() {
  try {
    localStorage.setItem('hp_config', JSON.stringify(state.config));
  } catch (e) {
    console.warn('Failed to save config:', e);
  }
}

export function saveBookmarks() {
  try {
    localStorage.setItem('hp_bookmarks', JSON.stringify(state.bookmarks));
  } catch (e) {
    console.warn('Failed to save bookmarks:', e);
  }
}

export function resetState() {
  state.config = { ...DEFAULT_CONFIG };
  state.bookmarks = [...DEFAULT_BOOKMARKS];
  saveConfig();
  saveBookmarks();
}
