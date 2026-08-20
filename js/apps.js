/**
 * App Launcher / Waffle Menu Module
 */

export const APPS = [
  {
    name: 'Calculator',
    url: 'https://francofantomius.com/calculator/',
    iconUrl: 'https://francofantomius.com/calculator/img/calculator_x128.png'
  },
  {
    name: 'Melo',
    url: 'https://melo.francofantomius.com/',
    iconUrl: 'https://melo.francofantomius.com/img/icons/icon.svg'
  },
  {
    name: 'Noten',
    url: 'https://noten.francofantomius.com/',
    iconUrl: 'https://noten.francofantomius.com/noten_x512.png'
  },
  {
    name: 'Scriben',
    url: 'https://scriben.francofantomius.com/',
    iconUrl: 'https://scriben.francofantomius.com/icons/icon.svg'
  },
  {
    name: 'Maps',
    url: 'https://maps.francofantomius.com/',
    iconUrl: 'https://maps.francofantomius.com/img/icons/maps.png'
  }
];

export const DEFAULT_GITHUB_PWAS = APPS;

export function renderApps() {
  const grid = document.getElementById('apps-grid');
  if (!grid) return;

  grid.innerHTML = '';

  APPS.forEach(app => {
    const item = document.createElement('a');
    item.href = app.url;
    item.target = '_blank';
    item.rel = 'noopener noreferrer';
    item.className = 'app-item';
    item.title = app.name;

    const initial = (app.name || 'A').charAt(0).toUpperCase();

    item.innerHTML = `
      <div class="app-icon-wrapper">
        ${app.iconUrl ? `<img src="${app.iconUrl}" class="app-icon" alt="${app.name}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : ''}
        <span class="app-icon-fallback" style="${app.iconUrl ? 'display:none;' : ''}">${initial}</span>
      </div>
      <span class="app-name">${app.name}</span>
    `;

    grid.appendChild(item);
  });
}

export function openAppsPopover() {
  const popover = document.getElementById('apps-popover');
  const btn = document.getElementById('apps-drawer-btn');
  if (!popover) return;

  popover.classList.add('open');
  popover.setAttribute('aria-hidden', 'false');
  if (btn) btn.setAttribute('aria-expanded', 'true');
}

export function closeAppsPopover() {
  const popover = document.getElementById('apps-popover');
  const btn = document.getElementById('apps-drawer-btn');
  if (!popover) return;

  popover.classList.remove('open');
  popover.setAttribute('aria-hidden', 'true');
  if (btn) btn.setAttribute('aria-expanded', 'false');
}

export function toggleAppsPopover() {
  const popover = document.getElementById('apps-popover');
  if (!popover) return;

  if (popover.classList.contains('open')) {
    closeAppsPopover();
  } else {
    openAppsPopover();
  }
}

export function initAppsDrawer() {
  const drawerBtn = document.getElementById('apps-drawer-btn');
  const container = document.getElementById('apps-container');

  renderApps();

  if (drawerBtn) {
    drawerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleAppsPopover();
    });
  }

  document.addEventListener('click', (e) => {
    if (container && !container.contains(e.target)) {
      closeAppsPopover();
    }
  });
}
