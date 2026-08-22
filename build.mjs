import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = __dirname;
const BUILD_DIR = path.join(ROOT_DIR, 'build');
const CSS_DIR = path.join(ROOT_DIR, 'css');
const JS_DIR = path.join(ROOT_DIR, 'js');
const LANGS_DIR = path.join(ROOT_DIR, 'langs');
const IMG_DIR = path.join(ROOT_DIR, 'img');

/**
 * Minify SVG markup by removing comments, redundant whitespace, and newlines.
 */
function minifySvg(svgContent) {
  return svgContent
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .trim();
}

/**
 * Minify HTML markup by removing comments and collapsing inter-tag whitespace.
 */
function minifyHtml(htmlContent) {
  let result = htmlContent;

  // 1. Remove importmap tag entirely in production bundle
  result = result.replace(/<script\s+type=["']importmap["']>[\s\S]*?<\/script>\s*/gi, '');

  // 2. Point CSS link to single bundled styles.css
  result = result.replace(/href=["']css\/styles\.css["']/g, 'href="styles.css"');

  // 3. Remove HTML comments (excluding conditional comments)
  result = result.replace(/<!--(?!\[if)[\s\S]*?-->/g, '');

  // 4. Collapse whitespace between tags
  result = result.replace(/>\s+</g, '><');

  // 5. Trim leading/trailing whitespace
  return result.trim();
}

/**
 * Minify inline scripts contained within HTML using esbuild transform.
 */
async function minifyInlineScripts(htmlContent, esbuild) {
  if (!esbuild) return htmlContent;

  const scriptRegex = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi;
  const matches = [...htmlContent.matchAll(scriptRegex)];
  let result = htmlContent;

  for (const match of matches) {
    const fullTag = match[0];
    const attrs = match[1];
    const code = match[2];

    if (attrs.includes('importmap') || !code.trim()) continue;

    try {
      const minified = await esbuild.transform(code, {
        loader: 'js',
        minify: true,
        legalComments: 'none'
      });
      const newTag = `<script${attrs}>${minified.code.trim()}</script>`;
      result = result.replace(fullTag, newTag);
    } catch {
      // Retain original script if minification fails
    }
  }

  return result;
}

async function build() {
  console.log('🚀 Starting homepage production build...');

  // 1. Clean and recreate build directory
  if (fs.existsSync(BUILD_DIR)) {
    fs.rmSync(BUILD_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(BUILD_DIR, { recursive: true });

  // 2. Read and compact all translation JSON files
  console.log('📦 Inlining language dictionaries (JSON)...');
  const translations = {};
  const langAssetList = [];
  const langsOutDir = path.join(BUILD_DIR, 'langs');
  fs.mkdirSync(langsOutDir, { recursive: true });

  if (fs.existsSync(LANGS_DIR)) {
    const langFiles = fs.readdirSync(LANGS_DIR).filter(f => f.endsWith('.json'));
    for (const file of langFiles) {
      const langCode = path.basename(file, '.json');
      const content = fs.readFileSync(path.join(LANGS_DIR, file), 'utf-8');
      const parsed = JSON.parse(content);
      translations[langCode] = parsed;
      langAssetList.push(`./langs/${file}`);

      // Write minified JSON to build/langs/
      fs.writeFileSync(path.join(langsOutDir, file), JSON.stringify(parsed));
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

  // 3. Bundle and minify CSS into a single build/styles.css
  console.log('🎨 Compacting and minifying CSS files into single styles.css...');
  const cssOrder = [
    'variables.css',
    'base.css',
    'clock.css',
    'search.css',
    'bookmarks.css',
    'modal.css',
    'settings.css',
    'apps.css',
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
      minify: true,
      legalComments: 'none'
    });
    fs.writeFileSync(path.join(BUILD_DIR, 'styles.css'), cssResult.code);
  } else {
    // Pure Node minification fallback
    const minifiedCss = bundledCss
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ')
      .replace(/\s*([\{\};:,>])\s*/g, '$1')
      .replace(/;}/g, '}')
      .trim();
    fs.writeFileSync(path.join(BUILD_DIR, 'styles.css'), minifiedCss);
  }
  console.log('   ✓ CSS bundled and minified successfully.');

  // 4. Bundle and tree-shake JS + inlined JSON into single build/app.js
  console.log('⚡ Tree-shaking and minifying JS modules into single app.js...');
  if (esbuild) {
    await esbuild.build({
      entryPoints: [path.join(ROOT_DIR, 'app.js')],
      bundle: true,
      minify: true,
      treeShaking: true,
      legalComments: 'none',
      format: 'esm',
      target: ['es2020'],
      outfile: path.join(BUILD_DIR, 'app.js'),
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
      'apps.js',
      'shortcuts.js',
      'pwa.js'
    ];

    let combinedCode = `window.__EMBEDDED_TRANSLATIONS__ = ${JSON.stringify(translations)};\n`;
    for (const f of jsFiles) {
      const content = fs.readFileSync(path.join(JS_DIR, f), 'utf-8');
      const cleaned = content
        .replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '')
        .replace(/export\s+(async\s+)?function/g, '$1function')
        .replace(/export\s+(const|let|var)/g, '$1')
        .replace(/export\s+\{[^}]+\};?/g, '');
      combinedCode += `\n/* js/${f} */\n` + cleaned;
    }

    const appMain = fs.readFileSync(path.join(ROOT_DIR, 'app.js'), 'utf-8')
      .replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '')
      .replace(/import\s+['"][^'"]+['"];?/g, '');
    combinedCode += '\n/* app.js */\n' + appMain;

    fs.writeFileSync(path.join(BUILD_DIR, 'app.js'), combinedCode);
  }
  console.log('   ✓ JS tree-shaken and bundled successfully.');

  // 5. Copy and optimize index.html
  console.log('📄 Optimizing and minifying index.html...');
  let indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf-8');
  indexHtml = await minifyInlineScripts(indexHtml, esbuild);
  indexHtml = minifyHtml(indexHtml);
  fs.writeFileSync(path.join(BUILD_DIR, 'index.html'), indexHtml);

  // 6. Copy and optimize static assets (img, manifest, .nojekyll)
  console.log('🖼️ Copying and minifying static assets (img, manifest, .nojekyll)...');
  const imgOutDir = path.join(BUILD_DIR, 'img');
  fs.mkdirSync(imgOutDir, { recursive: true });

  const imgAssetList = [];
  if (fs.existsSync(IMG_DIR)) {
    const imgFiles = fs.readdirSync(IMG_DIR);
    for (const file of imgFiles) {
      const srcPath = path.join(IMG_DIR, file);
      const destPath = path.join(imgOutDir, file);
      if (file.endsWith('.svg')) {
        const svgContent = fs.readFileSync(srcPath, 'utf-8');
        fs.writeFileSync(destPath, minifySvg(svgContent));
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
      imgAssetList.push(`./img/${file}`);
    }
  }

  // Copy and minify web manifest
  const manifestPath = path.join(ROOT_DIR, 'manifest.webmanifest');
  if (fs.existsSync(manifestPath)) {
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    try {
      const minifiedManifest = JSON.stringify(JSON.parse(manifestContent));
      fs.writeFileSync(path.join(BUILD_DIR, 'manifest.webmanifest'), minifiedManifest);
    } catch {
      fs.copyFileSync(manifestPath, path.join(BUILD_DIR, 'manifest.webmanifest'));
    }
  }

  // Create .nojekyll for GitHub Pages compatibility
  fs.writeFileSync(path.join(BUILD_DIR, '.nojekyll'), '');

  // 7. Generate optimized production Service Worker (sw.js)
  console.log('🛡️ Generating and minifying production Service Worker (sw.js)...');
  const allCoreAssets = [
    './',
    './index.html',
    './app.js',
    './styles.css',
    './manifest.webmanifest',
    ...imgAssetList,
    ...langAssetList
  ];

  const coreAssetsCode = `const CORE_ASSETS = [\n  ${allCoreAssets.map(a => `'${a}'`).join(',\n  ')}\n];`;

  let swCode = fs.readFileSync(path.join(ROOT_DIR, 'sw.js'), 'utf-8');
  swCode = swCode.replace(/const CORE_ASSETS = \[[^\]]*\];/s, coreAssetsCode);

  if (esbuild) {
    const swResult = await esbuild.transform(swCode, {
      loader: 'js',
      minify: true,
      legalComments: 'none'
    });
    fs.writeFileSync(path.join(BUILD_DIR, 'sw.js'), swResult.code);
  } else {
    fs.writeFileSync(path.join(BUILD_DIR, 'sw.js'), swCode);
  }

  console.log('✅ Build complete! All optimized production assets generated in build/');
}

build().catch(err => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
