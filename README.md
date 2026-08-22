# Homepage

A fast, lightweight, privacy-respecting browser homepage and new-tab startpage crafted with modern web standards and Material Design 3.

---

## Overview

**Homepage** delivers a clean, responsive, and distraction-free startpage experience designed for speed and productivity. It combines instant multi-engine search, quick-access bookmark management, an integrated apps launcher, customizable clock and greetings, full internationalization across 9 languages, and offline PWA support — all running 100% client-side with zero tracking or external telemetry.

---

## Features

- **Ultra-Fast and Lightweight**: Built with modern ES modules, vanilla JavaScript, and [Material Design 3](https://github.com/FrancoFantomius/material-components) Web Components without heavy runtime framework overhead.
- **Multi-Engine Search**: Switch seamlessly between privacy-focused and mainstream search engines (Startpage, DuckDuckGo, Brave Search, Google, Bing, Ecosia, Qwant). Direct URL and domain inputs navigate directly without querying a search engine.
- **Quick Access Bookmarks**: Add, edit, remove, and reorder bookmarks with automatic favicon fetching or custom icon URLs.
- **App Drawer**: Built-in launcher providing one-click access to the Franco Fantomius app ecosystem (Calculator, Melo, Noten, Scriben, Maps).
- **Digital Clock and Live Greetings**: Configurable 12-hour or 24-hour time format, optional live seconds display, dynamic time-of-day greetings, and an active date badge.
- **Material Design 3 and Themes**: Full support for System Auto theme detection, Dark Mode, and Light Mode with tokenized CSS variables.
- **Multilingual (i18n)**: Fully localized across 9 languages (English, German, Spanish, French, Italian, Japanese, Portuguese, Russian, Chinese) with automatic browser language detection and in-app language switching.
- **Offline and PWA Ready**: Installable as a standalone Progressive Web App on desktop and mobile. Pre-cached core assets and smart favicon caching via Service Worker.
- **Keyboard Navigation**: Complete keyboard accessibility for instant searching, launching bookmarks with number keys, and dialog management.
- **100% Privacy**: All bookmarks, preferences, and state are stored strictly in your browser's local storage (`localStorage`). No analytics, telemetry, or remote tracking.

---

## Keyboard Shortcuts

| Shortcut | Action | Description |
| :--- | :--- | :--- |
| <kbd>/</kbd> | **Focus Search** | Immediately focuses and selects the search input |
| <kbd>1</kbd> – <kbd>9</kbd> | **Launch Bookmark** | Opens the corresponding bookmark shortcut (1 to 9) |
| <kbd>Alt</kbd> + <kbd>1</kbd> – <kbd>9</kbd> | **Quick Launch** | Opens bookmark shortcuts even when the search bar or an input is focused |
| <kbd>Enter</kbd> | **Submit Search** | Executes search query or navigates directly if a URL is entered |
| <kbd>Escape</kbd> | **Close / Dismiss** | Closes active dialogs, dismisses context menus, closes app drawer, or unfocuses search |

---

## Supported Search Engines

| Engine | Query URL | Privacy Focus | Default |
| :--- | :--- | :---: | :---: |
| **Startpage** | `https://www.startpage.com/do/dsearch` | Yes | Yes |
| **DuckDuckGo** | `https://duckduckgo.com/` | Yes | No |
| **Brave Search** | `https://search.brave.com/search` | Yes | No |
| **Google** | `https://www.google.com/search` | No | No |
| **Bing** | `https://www.bing.com/search` | No | No |
| **Ecosia** | `https://www.ecosia.org/search` | Yes (Eco-friendly) | No |
| **Qwant** | `https://www.qwant.com/` | Yes | No |

---

## Supported Languages

| Code | Language | Native Name |
| :---: | :--- | :--- |
| `en` | English | English (Default) |
| `de` | German | Deutsch |
| `es` | Spanish | Español |
| `fr` | French | Français |
| `it` | Italian | Italiano |
| `ja` | Japanese | 日本語 |
| `pt` | Portuguese | Português |
| `ru` | Russian | Русский |
| `zh` | Chinese | 中文 |

---

## Getting Started

### Prerequisites

- **Node.js** (v18.0.0 or higher recommended)
- **npm** (v9.0.0 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/FrancoFantomius/homepage.git
   cd homepage
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Local Development

Because the application uses native ES modules and Service Workers, serve the root directory using any local HTTP server:

```bash
# Using npx serve
npx serve .

# Or using Python 3
python -m http.server 8080
```

Open `http://localhost:3000` (or the port specified by your local server) in your browser.

---

## Production Build

The project includes an optimized custom build pipeline (`build.mjs`) powered by `esbuild` to produce a tree-shaken, minified, production-ready distribution:

```bash
npm run build
```

### Build Process Details

- **Language Inlining**: Dictionaries from `langs/*.json` are inlined directly into `build/app.js` to eliminate network roundtrips for translations.
- **CSS Concatenation and Minification**: All modular CSS files (`css/*.css`) are aggregated in dependency order and minified into `build/styles.css`.
- **JS Bundling and Tree-Shaking**: ES modules and `@francofantomius/material-components` are bundled, tree-shaken, and minified into `build/app.js`.
- **HTML and Asset Optimization**: Removes import maps, optimizes inline bootstrap scripts, minifies SVG assets, and outputs a production Service Worker (`build/sw.js`) with an updated asset cache manifest.

### Output Structure (`build/`)

```
build/
├── index.html              # Minified HTML entry point
├── styles.css              # Minified, consolidated stylesheet
├── app.js                  # Tree-shaken, bundled JavaScript application
├── sw.js                   # Production Service Worker
├── manifest.webmanifest    # Minified Web App Manifest
├── img/                    # Minified SVG icons and graphics
├── langs/                  # Minified fallback language files
└── .nojekyll               # GitHub Pages static asset routing support
```

---

## Project Structure

```
homepage/
├── .github/
│   └── workflows/
│       └── deploy.yml              # Automated GitHub Actions deployment workflow
├── css/
│   ├── apps.css                    # App launcher drawer styling
│   ├── base.css                    # Base layout, typography, and container styles
│   ├── bookmarks.css               # Bookmarks grid, cards, context menus, and drag-and-drop
│   ├── clock.css                   # Digital clock and live greeting styles
│   ├── modal.css                   # Modal overlays and bookmark form styling
│   ├── responsive.css              # Mobile and tablet media queries
│   ├── search.css                  # Search bar container and input styling
│   ├── settings.css                # Settings dialog and options styling
│   ├── styles.css                  # Development stylesheet aggregator
│   └── variables.css               # CSS custom properties, M3 color tokens, and themes
├── img/                            # Local vector SVG icons and graphics
├── js/
│   ├── apps.js                     # App drawer and ecosystem shortcuts
│   ├── bookmarks.js                # Bookmark CRUD, persistence, and drag-and-drop
│   ├── clock.js                    # Clock tick scheduler, greetings, and date chips
│   ├── i18n.js                     # Internationalization engine and browser locale detector
│   ├── modal.js                    # Modal controller and focus trapping
│   ├── pwa.js                      # Service Worker registration and PWA installer
│   ├── search.js                   # Search engine handling and URL execution
│   ├── settings.js                 # Settings UI listeners and configuration applicator
│   ├── shortcuts.js                # Global keyboard shortcut event handlers
│   ├── state.js                    # State persistence and localStorage synchronization
│   └── theme.js                    # Theme management (Light / Dark / Auto)
├── langs/                          # Localized translation JSON dictionaries
├── app.js                          # Main application bootstrap and Material Components init
├── build.mjs                       # Custom build, tree-shaking, and bundling pipeline
├── index.html                      # Main application markup
├── LICENSE                         # MIT License
├── manifest.webmanifest            # Progressive Web App manifest
├── package.json                    # Project configuration and dependencies
├── README.md                       # Project documentation
└── sw.js                           # Service Worker implementation
```

---

## Configuration and Storage

All user configuration and bookmarks are persisted locally in the browser via `localStorage`:

| Key | Description | Default |
| :--- | :--- | :--- |
| `hp_config` | User preferences (theme, language, search engine, 24h format, show seconds, greetings, date) | `{"theme":"auto","language":"auto","searchEngine":"startpage",...}` |
| `hp_bookmarks` | User shortcuts array (id, title, url, custom icon) | Default 8 quick access shortcuts |

---

## Deployment

### Automated Deployment (GitHub Pages)

The repository includes a GitHub Actions workflow in `.github/workflows/deploy.yml` that builds and deploys the project to GitHub Pages automatically on push to the `main` branch.

### Manual Deployment

Deploy the contents of the `build/` directory to any static web host:
- **GitHub Pages**
- **Cloudflare Pages**
- **Vercel**
- **Netlify**

---

## License

This project is open source and available under the [MIT License](LICENSE).
