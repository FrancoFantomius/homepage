/**
 * Bookmarks Management & Context Menu Module
 */

import { state, saveBookmarks } from './state.js';
import { openModal, closeModal } from './modal.js';
import { t } from './i18n.js';

let activeContextMenu = null;

const bookmarksGrid = document.getElementById('bookmarks-grid');
const addBookmarkBtn = document.getElementById('add-bookmark-btn');
const bookmarkModal = document.getElementById('bookmark-modal');
const bookmarkForm = document.getElementById('bookmark-form');
const bookmarkIdInput = document.getElementById('bookmark-id');
const bookmarkTitleInput = document.getElementById('bookmark-title');
const bookmarkUrlInput = document.getElementById('bookmark-url');
const bookmarkIconInput = document.getElementById('bookmark-icon');
const bookmarkModalTitle = document.getElementById('bookmark-modal-title');
const closeBookmarkModalBtn = document.getElementById('close-bookmark-modal');
const cancelBookmarkBtn = document.getElementById('cancel-bookmark-btn');
const saveBookmarkBtn = document.getElementById('save-bookmark-btn');

export function getDomainFromUrl(url) {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.hostname;
  } catch {
    return '';
  }
}

export function getFaviconUrl(url, customIcon) {
  if (customIcon && customIcon.trim() !== '') {
    return customIcon;
  }
  const domain = getDomainFromUrl(url);
  if (!domain) return '';
  // DuckDuckGo Favicon Service
  return `https://icons.duckduckgo.com/ip3/${encodeURIComponent(domain)}.ico`;
}

export function closeActiveContextMenu() {
  if (activeContextMenu) {
    activeContextMenu.remove();
    activeContextMenu = null;
  }
}

export function openBookmarkContextMenu(e, bookmark) {
  closeActiveContextMenu();

  const menu = document.createElement('div');
  menu.className = 'context-menu';
  menu.addEventListener('click', (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
  });

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.innerHTML = `
    <img src="img/edit.svg" class="icon-img" width="14" height="14" alt="${t('bookmarks.edit')}">
    <span>${t('bookmarks.edit')}</span>
  `;
  editBtn.addEventListener('click', (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
    closeActiveContextMenu();
    openEditBookmarkModal(bookmark);
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'delete-btn';
  deleteBtn.innerHTML = `
    <img src="img/delete.svg" class="icon-img" width="14" height="14" alt="${t('bookmarks.delete')}">
    <span>${t('bookmarks.delete')}</span>
  `;
  deleteBtn.addEventListener('click', (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
    closeActiveContextMenu();
    deleteBookmark(bookmark.id);
  });

  menu.appendChild(editBtn);
  menu.appendChild(deleteBtn);

  const card = e.currentTarget.closest('.bookmark-card');
  if (card) {
    card.appendChild(menu);
    activeContextMenu = menu;
  }
}

export function renderBookmarks() {
  if (!bookmarksGrid) return;
  bookmarksGrid.innerHTML = '';

  state.bookmarks.forEach((bm, index) => {
    const card = document.createElement('a');
    card.className = 'bookmark-card';
    card.href = bm.url;
    card.setAttribute('data-id', bm.id);

    // Prevent navigation if clicking inside context menu or menu trigger
    card.addEventListener('click', (e) => {
      if (e.target.closest('.bookmark-menu-trigger') || e.target.closest('.context-menu')) {
        e.preventDefault();
        e.stopPropagation();
      }
    });

    // Right-click context menu support
    card.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openBookmarkContextMenu(e, bm);
    });

    // Number badge for 1-9 keyboard shortcut
    if (index < 9) {
      const badge = document.createElement('span');
      badge.className = 'bookmark-index-badge';
      badge.textContent = index + 1;
      card.appendChild(badge);
    }

    // Icon Container
    const iconContainer = document.createElement('div');
    iconContainer.className = 'bookmark-icon-container';

    const faviconUrl = getFaviconUrl(bm.url, bm.icon);
    const img = document.createElement('img');
    img.className = 'bookmark-icon';
    img.src = faviconUrl;
    img.alt = bm.title;
    img.loading = 'lazy';

    // Fallback if image fails to load
    img.onerror = () => {
      img.remove();
      const fallback = document.createElement('span');
      fallback.className = 'bookmark-fallback-icon';
      fallback.textContent = (bm.title || 'W').charAt(0).toUpperCase();
      iconContainer.appendChild(fallback);
    };

    iconContainer.appendChild(img);
    card.appendChild(iconContainer);

    // Title
    const titleSpan = document.createElement('span');
    titleSpan.className = 'bookmark-title';
    titleSpan.textContent = bm.title;
    card.appendChild(titleSpan);

    // Options menu button (three dots / settings)
    const menuBtn = document.createElement('button');
    menuBtn.type = 'button';
    menuBtn.className = 'bookmark-menu-trigger';
    menuBtn.setAttribute('aria-label', t('bookmarks.optionsAria', { title: bm.title }));
    menuBtn.innerHTML = `
      <img src="img/more_vert.svg" class="icon-img" width="14" height="14" alt="${t('bookmarks.edit')}">
    `;

    menuBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openBookmarkContextMenu(e, bm);
    });

    card.appendChild(menuBtn);
    bookmarksGrid.appendChild(card);
  });
}

export function openAddBookmarkModal() {
  if (!bookmarkIdInput || !bookmarkTitleInput || !bookmarkUrlInput || !bookmarkIconInput || !bookmarkModalTitle) return;
  bookmarkIdInput.value = '';
  bookmarkTitleInput.value = '';
  bookmarkUrlInput.value = '';
  bookmarkIconInput.value = '';
  bookmarkModalTitle.textContent = t('bookmarks.addShortcut');
  if (saveBookmarkBtn) saveBookmarkBtn.textContent = t('bookmarks.save');
  openModal(bookmarkModal);
  setTimeout(() => bookmarkTitleInput.focus(), 50);
}

export function openEditBookmarkModal(bm) {
  if (!bookmarkIdInput || !bookmarkTitleInput || !bookmarkUrlInput || !bookmarkIconInput || !bookmarkModalTitle) return;
  bookmarkIdInput.value = bm.id;
  bookmarkTitleInput.value = bm.title;
  bookmarkUrlInput.value = bm.url;
  bookmarkIconInput.value = bm.icon || '';
  bookmarkModalTitle.textContent = t('bookmarks.editShortcut');
  if (saveBookmarkBtn) saveBookmarkBtn.textContent = t('bookmarks.saveChanges');
  openModal(bookmarkModal);
  setTimeout(() => bookmarkTitleInput.focus(), 50);
}

export function saveBookmarkHandler(e) {
  e.preventDefault();
  const id = bookmarkIdInput.value.trim();
  const title = bookmarkTitleInput.value.trim();
  let url = bookmarkUrlInput.value.trim();
  const icon = bookmarkIconInput.value.trim();

  if (!url) return;
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }

  if (id) {
    // Edit existing
    const idx = state.bookmarks.findIndex(b => b.id === id);
    if (idx !== -1) {
      state.bookmarks[idx] = { ...state.bookmarks[idx], title, url, icon };
    }
  } else {
    // Add new
    state.bookmarks.push({
      id: Date.now().toString(),
      title: title || getDomainFromUrl(url) || t('bookmarks.shortcut'),
      url,
      icon
    });
  }

  saveBookmarks();
  renderBookmarks();
  closeModal(bookmarkModal);
}

export function deleteBookmark(id) {
  state.bookmarks = state.bookmarks.filter(b => b.id !== id);
  saveBookmarks();
  renderBookmarks();
}

export function initBookmarks() {
  if (addBookmarkBtn) {
    addBookmarkBtn.addEventListener('click', openAddBookmarkModal);
  }
  if (closeBookmarkModalBtn) {
    closeBookmarkModalBtn.addEventListener('click', () => closeModal(bookmarkModal));
  }
  if (cancelBookmarkBtn) {
    cancelBookmarkBtn.addEventListener('click', () => closeModal(bookmarkModal));
  }
  if (bookmarkForm) {
    bookmarkForm.addEventListener('submit', saveBookmarkHandler);
  }

  // Close context menu on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.context-menu') && !e.target.closest('.bookmark-menu-trigger')) {
      closeActiveContextMenu();
    }
  });

  renderBookmarks();
}
