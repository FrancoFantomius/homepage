# Homepage

An ultra-fast, lightweight, customizable, and privacy-respecting browser homepage and startpage built with vanilla web technologies.

## Overview

Homepage provides a clean, responsive new tab experience designed for speed and productivity. It features instant search provider switching, quick access bookmark management, multiple themes, multilingual localization, keyboard shortcuts, and Progressive Web App (PWA) offline capabilities.

## Features

- Fast and lightweight: Built with vanilla HTML, CSS, and modern JavaScript without heavy runtime frameworks.
- Multiple search engines: Easily switch between privacy-focused and mainstream search engines (Startpage, DuckDuckGo, Brave Search, Google, Bing, Ecosia, Qwant).
- Customizable shortcuts: Add, edit, remove, and reorder quick-access bookmarks with automatic favicon fetching or custom icons.
- Digital clock and greeting: Time display supporting 12-hour and 24-hour formats, optional seconds, dynamic time-based greetings, and date badges.
- Themes and appearance: Dark mode, Light mode, and System Auto detection.
- Multilingual support: Fully localized across 9 languages (English, German, Spanish, French, Italian, Japanese, Portuguese, Russian, Chinese) with automatic browser locale detection.
- PWA and offline ready: Service worker caching and web app manifest for standalone desktop/mobile installation and offline support.
- Keyboard navigation: Full keyboard control for searching and shortcut launching.
- Privacy-oriented: Configuration and bookmarks are stored strictly in your browser's local storage.

## Keyboard Shortcuts

| Shortcut | Description |
| --- | --- |
| `/` | Focus and select search input |
| `1` - `9` | Launch bookmark shortcuts 1 through 9 |
| `Alt + 1` - `9` | Launch bookmark shortcuts 1 through 9 (works even when search input is focused) |
| `Escape` | Close open modals, dismiss context menus, or unfocus search input |
| `Enter` | Submit search |

## Supported Search Engines

- Startpage (default)
- Google
- DuckDuckGo
- Brave Search
- Bing
- Ecosia
- Qwant

## Supported Languages

- English (`en`)
- German (`de`)
- Spanish (`es`)
- French (`fr`)
- Italian (`it`)
- Japanese (`ja`)
- Portuguese (`pt`)
- Russian (`ru`)
- Chinese (`zh`)

## Getting Started

### Prerequisites

- Node.js (version 18 or higher recommended)
- npm

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/FrancoFantomius/homepage.git
cd homepage
npm install
```

### Local Development

Because the project uses standard ES modules and a Service Worker, serve the root directory using any local web server:

```bash
npx serve .
```

Alternatively, you can open the project with live server extensions in your editor.

### Production Build

Run the build script to compile and minify CSS, bundle JavaScript modules, inline translation dictionaries, and generate the distribution files:

```bash
npm run build
```

All production-ready assets are generated in the `dist/` directory:
- `dist/index.html`: Optimized HTML entry point
- `dist/styles.css`: Minified and concatenated CSS stylesheet
- `dist/app.js`: Bundled and minified JavaScript bundle with embedded translations
- `dist/sw.js`: Optimized production Service Worker
- `dist/img/`: Application icons and graphical assets
- `dist/manifest.webmanifest`: Web application manifest

## Project Structure

```
homepage/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Pages automated deployment workflow
├── css/
│   ├── base.css                # Base layout and global elements
│   ├── bookmarks.css           # Bookmarks grid, cards, and context menu styles
│   ├── clock.css               # Digital clock and greeting styles
│   ├── modal.css               # Modal overlays and forms
│   ├── responsive.css          # Breakpoints and responsive design
│   ├── search.css              # Search bar and input styling
│   ├── settings.css            # Settings modal controls
│   ├── styles.css              # Main stylesheet aggregator
│   └── variables.css           # CSS custom properties and color palettes
├── img/                        # SVG icons and graphics
├── js/
│   ├── bookmarks.js            # Bookmark management and drag/drop reordering
│   ├── clock.js                # Clock rendering and live time updates
│   ├── i18n.js                 # Localization engine and dictionary loader
│   ├── modal.js                # Modal opening, closing, and focus trapping
│   ├── pwa.js                  # Service worker registration and PWA logic
│   ├── search.js               # Search engine switching and URL execution
│   ├── settings.js             # Settings configuration UI and events
│   ├── shortcuts.js            # Global keyboard shortcut listeners
│   ├── state.js                # State management and localStorage synchronization
│   └── theme.js                # Theme switching and DOM theme attributes
├── langs/                      # Translation JSON files for each supported language
├── app.js                      # Main application bootstrap script
├── build.mjs                   # Custom build and bundling pipeline
├── index.html                  # Main application markup
├── LICENSE                     # MIT License
├── manifest.webmanifest        # PWA manifest
├── package.json                # Project dependencies and npm scripts
├── README.md                   # Project documentation
└── sw.js                       # Service worker implementation
```

## Deployment

A GitHub Actions workflow is included in `.github/workflows/deploy.yml` to automatically build and deploy the application to GitHub Pages upon pushing to the `main` or `master` branch.

To deploy manually, point any static file host (such as GitHub Pages, Netlify, Vercel, or Cloudflare Pages) to the `dist/` output directory.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
