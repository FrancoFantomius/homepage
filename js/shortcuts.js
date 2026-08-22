/**
 * Keyboard Shortcuts Module
 */

import { state } from './state.js';
import { closeModal } from './modal.js';
import { closeActiveContextMenu } from './bookmarks.js';

export function initShortcuts() {
  const searchInput = document.getElementById('search-input');
  const bookmarkModal = document.getElementById('bookmark-modal');
  const settingsModal = document.getElementById('settings-modal');

  window.addEventListener('keydown', (e) => {
    const isInputFocused = document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);
    const appDrawer = document.querySelector('md-app-drawer');

    // Escape key -> close modals, popovers, context menus or blur search
    if (e.key === 'Escape') {
      if (bookmarkModal) closeModal(bookmarkModal);
      if (settingsModal) closeModal(settingsModal);
      if (appDrawer) appDrawer.open = false;
      closeActiveContextMenu();
      if (isInputFocused) {
        document.activeElement.blur();
      }
      return;
    }

    // Alt + 1-9 -> Launch bookmark shortcut directly (works even when search input is focused)
    if (e.altKey && !e.ctrlKey && !e.metaKey && !isNaN(parseInt(e.key, 10))) {
      const digit = parseInt(e.key, 10);
      if (digit >= 1 && digit <= 9) {
        const targetBookmark = state.bookmarks[digit - 1];
        if (targetBookmark) {
          e.preventDefault();
          window.location.href = targetBookmark.url;
          return;
        }
      }
    }

    // If typing inside an input field or a modal/drawer is open, ignore subsequent shortcuts
    const isModalOpen = (bookmarkModal && bookmarkModal.classList.contains('open')) ||
                        (settingsModal && settingsModal.classList.contains('open')) ||
                        (appDrawer && (appDrawer.hasAttribute('open') || appDrawer.open));

    if (isInputFocused || isModalOpen) {
      return;
    }

    // Ignore single-key shortcuts when modifier keys (Ctrl, Meta/Command, Alt) are held down
    if (e.ctrlKey || e.metaKey || e.altKey) {
      return;
    }

    // '/' to focus search input
    if (e.key === '/' && searchInput) {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
      return;
    }

    // 1-9 to launch bookmark (only without modifiers)
    const digit = parseInt(e.key, 10);
    if (!isNaN(digit) && digit >= 1 && digit <= 9) {
      const targetBookmark = state.bookmarks[digit - 1];
      if (targetBookmark) {
        e.preventDefault();
        window.location.href = targetBookmark.url;
      }
    }
  });
}
