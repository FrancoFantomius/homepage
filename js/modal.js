/**
 * Modal Handling Module
 */

export function openModal(modal) {
  if (!modal) return;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}

export function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}

export function initModals() {
  const bookmarkModal = document.getElementById('bookmark-modal');
  const settingsModal = document.getElementById('settings-modal');

  // Close when clicking overlay backdrop
  [bookmarkModal, settingsModal].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal(modal);
        }
      });
    }
  });
}
