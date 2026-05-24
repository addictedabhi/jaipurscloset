import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW_DIR = join(__dirname, '..', 'assets', 'images', '_raw');
const BASE = 'https://jaipurscloset.com';
const PAGES = ['/', '/pages/about', '/pages/contact'];

async function ensureDir(path) {
  if (!existsSync(path)) await mkdir(path, { recursive: true });
}

async function fetchText(url) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} ${url}`);
  return res.text();
}

async function downloadImage(url, outDir) {
  const cleanUrl = url.split('?')[0];
  const fname = basename(cleanUrl);
  const out = join(outDir, fname);
  if (existsSync(out)) {
    console.log(`skip (exists): ${fname}`);
    return;
  }
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`failed ${res.status}: ${url}`);
    return;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(out, buf);
  console.log(`saved: ${fname}`);
}

function extractImageUrls(html) {
  const $ = cheerio.load(html);
  const urls = new Set();
  $('img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src');
    const srcset = $(el).attr('srcset');
    if (src) urls.add(src.startsWith('//') ? `https:${src}` : src);
    if (srcset) {
      srcset.split(',').forEach(part => {
        const u = part.trim().split(' ')[0];
        if (u) urls.add(u.startsWith('//') ? `https:${u}` : u);
      });
    }
  });
  return [...urls].filter(u => /\.(jpe?g|png|webp)$/i.test(u.split('?')[0]));
}

async function main() {
  await ensureDir(RAW_DIR);
  for (const path of PAGES) {
    console.log(`\n--- ${path} ---`);
    let html;
    try {
      html = await fetchText(BASE + path);
    } catch (err) {
      console.warn(`skipping page ${path}: ${err.message}`);
      continue;
    }
    const imgs = extractImageUrls(html);
    console.log(`found ${imgs.length} images`);
    for (const url of imgs) {
      try {
        await downloadImage(url, RAW_DIR);
      } catch (err) {
        console.warn(`error: ${url}: ${err.message}`);
      }
    }
  }
  console.log('\nDone. Raw images in:', RAW_DIR);
  console.log('Next: convert chosen images to WebP and place into assets/images/');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
