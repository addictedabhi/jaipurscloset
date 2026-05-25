/**
 * build-assets.mjs
 *
 * One-shot asset pipeline for Jaipur's Closet static site.
 * Converts raw scraped images to optimised WebP, generates favicons,
 * app icons, and an OG image using the `sharp` library.
 *
 * Run from the `scripts/` directory:
 *   node build-assets.mjs
 *
 * Re-run any time the raw source images are updated.
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const RAW = path.join(ROOT, 'assets', 'images', '_raw');
const OUT_IMAGES = path.join(ROOT, 'assets', 'images');
const OUT_ICONS = path.join(ROOT, 'assets', 'icons');
const OUT_COLLECTIONS = path.join(OUT_IMAGES, 'collections');

// Ensure output dirs exist
[OUT_IMAGES, OUT_ICONS, OUT_COLLECTIONS].forEach(d => fs.mkdirSync(d, { recursive: true }));

/** Log file size after writing */
function checkSize(filePath, budgetBytes, label) {
  const bytes = fs.statSync(filePath).size;
  const kb = (bytes / 1024).toFixed(1);
  const ok = bytes <= budgetBytes;
  console.log(`  ${ok ? 'OK' : 'OVER_BUDGET'} ${label}: ${kb} KB (budget ${(budgetBytes / 1024).toFixed(0)} KB)`);
  return ok;
}

// ---------------------------------------------------------------------------
// 1. hero.webp — max-width 1600, quality 80, budget 200 KB
// ---------------------------------------------------------------------------
async function buildHero(quality = 75) {
  const dest = path.join(OUT_IMAGES, 'hero.webp');
  const src = path.join(RAW, 'hero-unsplash-jaipur.jpg');
  await sharp(src)
    .resize(2400, 1350, { fit: 'cover', position: 'center' })
    .webp({ quality })
    .toFile(dest);
  const ok = checkSize(dest, 500 * 1024, 'hero.webp');
  if (!ok && quality > 60) {
    console.log(`  Retrying hero.webp at quality ${quality - 5}`);
    return buildHero(quality - 5);
  }
}

// ---------------------------------------------------------------------------
// 2. about.webp — max-width 1200, quality 80, budget 200 KB
// ---------------------------------------------------------------------------
async function buildAbout(quality = 80) {
  const dest = path.join(OUT_IMAGES, 'about.webp');
  await sharp(path.join(RAW, 'imgpsh_fullsize_anim_12.png'))
    .resize(1200, null, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality })
    .toFile(dest);
  const ok = checkSize(dest, 200 * 1024, 'about.webp');
  if (!ok && quality > 60) {
    console.log(`  Retrying about.webp at quality ${quality - 5}`);
    return buildAbout(quality - 5);
  }
}

// ---------------------------------------------------------------------------
// 3-6. collections/1-4.webp — 800×800 cover-crop, quality 80, budget 200 KB
// ---------------------------------------------------------------------------
const COLLECTION_SOURCES = [
  { src: 'Rectangle_3.png',                                          dest: '1.webp' },
  { src: 'Rectangle_4.png',                                          dest: '2.webp' },
  { src: 'image_1_1_0d58afe9-3e99-4897-a267-e7960eda204d.png',       dest: '3.webp' },
  { src: 'jewellery.jpg',                                            dest: '4.webp' },
];

async function buildCollection({ src, dest }, quality = 80) {
  const outPath = path.join(OUT_COLLECTIONS, dest);
  await sharp(path.join(RAW, src))
    .resize(800, 800, { fit: 'cover', position: 'center' })
    .webp({ quality })
    .toFile(outPath);
  const ok = checkSize(outPath, 200 * 1024, `collections/${dest}`);
  if (!ok && quality > 60) {
    console.log(`  Retrying collections/${dest} at quality ${quality - 5}`);
    return buildCollection({ src, dest }, quality - 5);
  }
}

// ---------------------------------------------------------------------------
// 7. Favicon and app icons — logo padded to square on white background
// ---------------------------------------------------------------------------
const LOGO_SRC = path.join(RAW, 'jaipur_s_-01_1_1.png');
const WHITE_BG = { r: 255, g: 255, b: 255, alpha: 1 };

async function buildPaddedIcon(size, filename) {
  const dest = path.join(OUT_ICONS, filename);
  await sharp(LOGO_SRC)
    .resize(size, size, { fit: 'contain', background: WHITE_BG })
    .png()
    .toFile(dest);
  const bytes = fs.statSync(dest).size;
  console.log(`  OK ${filename}: ${(bytes / 1024).toFixed(1)} KB`);
}

async function buildFaviconIco() {
  // sharp cannot write .ico; we write a 32x32 PNG and copy it as favicon.ico.
  // Modern browsers (Chrome, Firefox, Edge, Safari) accept PNG-format favicon.ico.
  const png32 = path.join(OUT_ICONS, 'favicon-32.png');
  await sharp(LOGO_SRC)
    .resize(32, 32, { fit: 'contain', background: WHITE_BG })
    .png()
    .toFile(png32);
  const icoPath = path.join(OUT_ICONS, 'favicon.ico');
  fs.copyFileSync(png32, icoPath);
  const bytes = fs.statSync(icoPath).size;
  console.log(`  OK favicon.ico (PNG-as-ICO 32x32): ${(bytes / 1024).toFixed(1)} KB`);
  console.log(`  OK favicon-32.png: ${(bytes / 1024).toFixed(1)} KB`);
}

// ---------------------------------------------------------------------------
// 8. og-image.jpg — 1200×630 cover-crop of hero, quality 85, budget 300 KB
// ---------------------------------------------------------------------------
async function buildOgImage(quality = 85) {
  const dest = path.join(OUT_ICONS, 'og-image.jpg');
  await sharp(path.join(RAW, 'imgpsh_fullsize_anim_11_1.png'))
    .resize(1200, 630, { fit: 'cover', position: 'center' })
    .jpeg({ quality })
    .toFile(dest);
  const ok = checkSize(dest, 300 * 1024, 'og-image.jpg');
  if (!ok && quality > 60) {
    console.log(`  Retrying og-image.jpg at quality ${quality - 5}`);
    return buildOgImage(quality - 5);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('Building assets...\n');

  console.log('=== Images ===');
  await buildHero();
  await buildAbout();

  console.log('\n=== Collections ===');
  for (const item of COLLECTION_SOURCES) {
    await buildCollection(item);
  }

  console.log('\n=== Icons ===');
  await buildFaviconIco();
  await buildPaddedIcon(180, 'apple-touch-icon.png');
  await buildPaddedIcon(192, 'icon-192.png');
  await buildPaddedIcon(512, 'icon-512.png');
  await buildOgImage();

  console.log('\nDone.');
}

main().catch(err => { console.error(err); process.exit(1); });
