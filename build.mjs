import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = __dirname;
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const CSS_DIR = path.join(ROOT_DIR, 'css');
const JS_DIR = path.join(ROOT_DIR, 'js');
const LANGS_DIR = path.join(ROOT_DIR, 'langs');
const IMG_DIR = path.join(ROOT_DIR, 'img');

async function build() {
  console.log('🚀 Starting homepage production build...');

  // 1. Clean and recreate dist directory
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(DIST_DIR, { recursive: true });

  // 2. Read and compact all translation JSON files
  console.log('📦 Inlining language dictionaries (JSON)...');
  const translations = {};
  if (fs.existsSync(LANGS_DIR)) {
    const langFiles = fs.readdirSync(LANGS_DIR).filter(f => f.endsWith('.json'));
    for (const file of langFiles) {
      const langCode = path.basename(file, '.json');
      const content = fs.readFileSync(path.join(LANGS_DIR, file), 'utf-8');
      translations[langCode] = JSON.parse(content);
    }
  }
  console.log(`   Embedded ${Object.keys(translations).length} languages: ${Object.keys(translations).join(', ')}`);

  // Try importing esbuild if available
  let esbuild = null;
  try {
    esbuild = await import('esbuild');
  } catch {
    console.log('   (esbuild not installed locally, using native fallback bundler)');
  }

  // 3. Bundle and minify CSS into a single dist/styles.css
  console.log('🎨 Compacting all CSS files into single styles.css...');
  const cssOrder = [
    'variables.css',
    'base.css',
    'clock.css',
    'search.css',
    'bookmarks.css',
    'modal.css',
    'settings.css',
    'responsive.css'
  ];

  let bundledCss = '';
  for (const file of cssOrder) {
    const filePath = path.join(CSS_DIR, file);
    if (fs.existsSync(filePath)) {
      bundledCss += `/* ${file} */\n` + fs.readFileSync(filePath, 'utf-8') + '\n';
    }
  }

  if (esbuild) {
    const cssResult = await esbuild.transform(bundledCss, {
      loader: 'css',
      minify: true
    });
    fs.writeFileSync(path.join(DIST_DIR, 'styles.css'), cssResult.code);
  } else {
    // Pure Node minification fallback
    const minifiedCss = bundledCss
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ')
      .replace(/\s*([\{\};:,>])\s*/g, '$1')
      .replace(/;}/g, '}')
      .trim();
    fs.writeFileSync(path.join(DIST_DIR, 'styles.css'), minifiedCss);
  }
  console.log('   ✓ CSS bundled successfully.');

  // 4. Bundle JS + inlined JSON into single dist/app.js
  console.log('⚡ Compacting JS modules and JSON data into single app.js...');
  if (esbuild) {
    await esbuild.build({
      entryPoints: [path.join(ROOT_DIR, 'app.js')],
      bundle: true,
      minify: true,
      format: 'esm',
      target: ['es2020'],
      outfile: path.join(DIST_DIR, 'app.js'),
      define: {
        '__EMBEDDED_TRANSLATIONS__': JSON.stringify(translations)
      }
    });
  } else {
    // Native fallback bundler for zero-dependency environments
    const jsFiles = [
      'state.js',
      'i18n.js',
      'theme.js',
      'clock.js',
      'bookmarks.js',
      'search.js',
      'modal.js',
      'settings.js',
      'shortcuts.js',
      'pwa.js'
    ];

    let combinedCode = `window.__EMBEDDED_TRANSLATIONS__ = ${JSON.stringify(translations)};\n`;
    for (const f of jsFiles) {
      const content = fs.readFileSync(path.join(JS_DIR, f), 'utf-8');
      // Strip imports and exports for simple concatenation
      const cleaned = content
        .replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '')
        .replace(/export\s+(async\s+)?function/g, '$1function')
        .replace(/export\s+(const|let|var)/g, '$1')
        .replace(/export\s+\{[^}]+\};?/g, '');
      combinedCode += `\n/* js/${f} */\n` + cleaned;
    }

    const appMain = fs.readFileSync(path.join(ROOT_DIR, 'app.js'), 'utf-8')
      .replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '');
    combinedCode += '\n/* app.js */\n' + appMain;

    fs.writeFileSync(path.join(DIST_DIR, 'app.js'), combinedCode);
  }
  console.log('   ✓ JS & JSON bundled successfully.');

  // 5. Copy and optimize index.html
  console.log('📄 Updating and writing index.html...');
  let indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf-8');
  // Update CSS link to single styles.css
  indexHtml = indexHtml.replace('href="css/styles.css"', 'href="styles.css"');
  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), indexHtml);

  // 6. Copy static images
  console.log('🖼️ Copying assets (img and manifest)...');
  if (fs.existsSync(IMG_DIR)) {
    fs.cpSync(IMG_DIR, path.join(DIST_DIR, 'img'), { recursive: true });
  }

  // Copy manifest
  const manifestPath = path.join(ROOT_DIR, 'manifest.webmanifest');
  if (fs.existsSync(manifestPath)) {
    fs.copyFileSync(manifestPath, path.join(DIST_DIR, 'manifest.webmanifest'));
  }

  // 7. Generate optimized Service Worker for single-bundle distribution
  console.log('🛡️ Generating production Service Worker (sw.js)...');
  const imgFiles = fs.existsSync(IMG_DIR)
    ? fs.readdirSync(IMG_DIR).map(f => `'./img/${f}'`)
    : [];

  const coreAssetsCode = `const CORE_ASSETS = [\n  './',\n  './index.html',\n  './app.js',\n  './styles.css',\n  './manifest.webmanifest',\n  ${imgFiles.join(',\n  ')}\n];`;

  let swCode = fs.readFileSync(path.join(ROOT_DIR, 'sw.js'), 'utf-8');
  swCode = swCode.replace(/const CORE_ASSETS = \[[^\]]*\];/s, coreAssetsCode);

  if (esbuild) {
    const swResult = await esbuild.transform(swCode, {
      loader: 'js',
      minify: true
    });
    fs.writeFileSync(path.join(DIST_DIR, 'sw.js'), swResult.code);
  } else {
    fs.writeFileSync(path.join(DIST_DIR, 'sw.js'), swCode);
  }

  console.log('✅ Build complete! All output written to dist/');
}

build().catch(err => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
