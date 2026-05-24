# Jaipur's Closet Static 1-Pager — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static, single-page informational website at `https://jaipurscloset.com/` that replaces the Shopify store and routes purchase intent to Instagram DM and WhatsApp.

**Architecture:** Plain HTML5 + CSS3 + vanilla JS, no build framework. Hosted on GitHub Pages from `main` branch root, auto-deployed via GitHub Actions. Assets scraped once from the existing Shopify site and committed to the repo. SEO via meta tags, Open Graph, Twitter Card, JSON-LD schema, robots.txt, and sitemap.xml.

**Tech Stack:** HTML5, CSS3 (custom properties, flex/grid, mobile-first media queries), vanilla JS (ES2020), Node.js (scrape script only, run locally), GitHub Actions (`actions/checkout@v4`, `actions/configure-pages@v5`, `actions/upload-pages-artifact@v3`, `actions/deploy-pages@v4`).

---

## File Structure

Files this plan will produce:

- `index.html` — entire page markup, meta, JSON-LD, all sections
- `style.css` — design tokens (`:root`), base, layout, components, utilities, media queries
- `script.js` — smooth-scroll handler, mobile nav toggle
- `robots.txt` — crawler permissions + sitemap reference
- `sitemap.xml` — single URL sitemap
- `site.webmanifest` — PWA manifest for icons
- `CNAME` — placeholder for custom domain
- `README.md` — deploy + edit guide
- `.gitignore` — node_modules, raw scrape output (optional)
- `.github/workflows/deploy.yml` — GitHub Pages deploy workflow
- `scripts/scrape.mjs` — one-shot Node script to download images from jaipurscloset.com
- `scripts/package.json` — declares scrape script deps and `type: "module"`
- `assets/images/_raw/*` — original scraped images (committed for reference)
- `assets/images/hero.webp`, `assets/images/about.webp`, `assets/images/collections/*.webp` — optimized images
- `assets/icons/favicon.ico`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `og-image.jpg` — favicons + social preview

---

## Task 1: Repo Scaffold and Git Ignore

**Files:**
- Create: `.gitignore`
- Create: `README.md`
- Create: `CNAME`

- [ ] **Step 1: Create `.gitignore`**

Write to `.gitignore`:

```
node_modules/
.DS_Store
Thumbs.db
*.log
.env
.vscode/
.idea/
```

- [ ] **Step 2: Create `CNAME` placeholder**

Write to `CNAME`:

```
jaipurscloset.com
```

- [ ] **Step 3: Create `README.md`**

Write to `README.md`:

```markdown
# Jaipur's Closet — Static Site

Single-page informational website. Sales happen on Instagram (`@jaipurscloset`).

## Hosting

GitHub Pages, deployed automatically on push to `main` via `.github/workflows/deploy.yml`.

## Local Preview

Open `index.html` directly in a browser, or serve with any static server:

```bash
npx serve .
```

## Editing Content

All copy lives in `index.html`. Edit, commit, push — auto-deploys.

## Updating Images

1. Place new source images in `assets/images/_raw/`.
2. Convert to WebP (max 1600px wide, target < 200KB):
   ```bash
   cwebp -q 80 input.jpg -o assets/images/hero.webp
   ```
3. Commit and push.

## Re-scraping from the Old Shopify Site

```bash
cd scripts
npm install
node scrape.mjs
```

Downloads images into `../assets/images/_raw/`.

## Contact Channels

- Instagram DM: https://ig.me/m/jaipurscloset
- WhatsApp: configured via the `WHATSAPP_NUMBER` placeholder in `index.html` — search and replace once the number is provided.
```

- [ ] **Step 4: Commit**

```bash
git add .gitignore README.md CNAME
git commit -m "chore: scaffold repo with gitignore, readme, CNAME placeholder"
```

---

## Task 2: One-Shot Image Scrape Script

**Files:**
- Create: `scripts/package.json`
- Create: `scripts/scrape.mjs`

- [ ] **Step 1: Create `scripts/package.json`**

Write to `scripts/package.json`:

```json
{
  "name": "jaipurscloset-scrape",
  "version": "1.0.0",
  "type": "module",
  "private": true,
  "scripts": {
    "scrape": "node scrape.mjs"
  },
  "dependencies": {
    "cheerio": "^1.0.0"
  }
}
```

- [ ] **Step 2: Create `scripts/scrape.mjs`**

Write to `scripts/scrape.mjs`:

```javascript
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
    const html = await fetchText(BASE + path);
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
```

- [ ] **Step 3: Install deps and run the scrape**

Run:

```bash
cd scripts
npm install
node scrape.mjs
```

Expected: console logs `--- / ---`, `--- /pages/about ---`, `--- /pages/contact ---`, lists found images, downloads to `../assets/images/_raw/`. No fatal errors.

- [ ] **Step 4: Commit the script and raw images**

```bash
cd ..
git add scripts/package.json scripts/scrape.mjs scripts/package-lock.json assets/images/_raw
git commit -m "feat(scrape): add one-shot image scraper, capture raw assets from old store"
```

---

## Task 3: Select, Convert, and Place Hero/About/Collection Images

**Files:**
- Create: `assets/images/hero.webp`
- Create: `assets/images/about.webp`
- Create: `assets/images/collections/{1..N}.webp`

- [ ] **Step 1: Pick images**

Inspect `assets/images/_raw/`. Identify:
- One wide hero candidate (landscape, brand-representative)
- One About-section image (portrait or square OK)
- One image per collection tile (count = number of collection names confirmed during scrape; if unknown, default to 4 tiles)

If suitable images are missing, re-run `node scripts/scrape.mjs` and check `_raw/`. If still missing, document the gap in `README.md` under an "Open Items" section and continue with placeholders (solid-color CSS backgrounds).

- [ ] **Step 2: Convert to WebP**

Using `cwebp` (install via `brew install webp` / `choco install webp` / `apt install webp`) or any image tool:

```bash
cwebp -q 80 -resize 1600 0 assets/images/_raw/<hero-source> -o assets/images/hero.webp
cwebp -q 80 -resize 1200 0 assets/images/_raw/<about-source> -o assets/images/about.webp
mkdir -p assets/images/collections
cwebp -q 80 -resize 800 0 assets/images/_raw/<cat1-source> -o assets/images/collections/1.webp
# repeat per collection tile
```

Verify each output `.webp` is under 200 KB.

- [ ] **Step 3: Commit final images**

```bash
git add assets/images/hero.webp assets/images/about.webp assets/images/collections
git commit -m "feat(assets): add optimized WebP hero, about, and collection images"
```

---

## Task 4: Favicons, Manifest, and OG Image

**Files:**
- Create: `assets/icons/favicon.ico`
- Create: `assets/icons/apple-touch-icon.png` (180×180)
- Create: `assets/icons/icon-192.png` (192×192)
- Create: `assets/icons/icon-512.png` (512×512)
- Create: `assets/icons/og-image.jpg` (1200×630)
- Create: `site.webmanifest`

- [ ] **Step 1: Generate favicons**

Use either:
- `https://realfavicongenerator.net/` (upload brand logo, download zip)
- Local imagemagick:

```bash
magick assets/images/_raw/<logo-source> -resize 180x180 assets/icons/apple-touch-icon.png
magick assets/images/_raw/<logo-source> -resize 192x192 assets/icons/icon-192.png
magick assets/images/_raw/<logo-source> -resize 512x512 assets/icons/icon-512.png
magick assets/images/_raw/<logo-source> -define icon:auto-resize=16,32,48 assets/icons/favicon.ico
```

If no logo is in `_raw/`, scrape `<link rel="icon">` from the live site manually or generate a text-mark image.

- [ ] **Step 2: Generate OG image (1200×630)**

Create a 1200×630 JPG showing the brand name and tagline over a hero crop. Options:
- `magick assets/images/hero.webp -resize 1200x630^ -gravity center -extent 1200x630 assets/icons/og-image.jpg`
- Or design manually in Figma/Canva and export.

Target file size: < 300 KB.

- [ ] **Step 3: Create `site.webmanifest`**

Write to `site.webmanifest`:

```json
{
  "name": "Jaipur's Closet",
  "short_name": "Jaipur's Closet",
  "description": "Handcrafted Jaipuri fashion. Shop on Instagram.",
  "icons": [
    { "src": "/assets/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/assets/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "theme_color": "#000000",
  "background_color": "#ffffff",
  "display": "standalone",
  "start_url": "/"
}
```

- [ ] **Step 4: Commit**

```bash
git add assets/icons site.webmanifest
git commit -m "feat(seo): add favicons, web app manifest, and OG preview image"
```

---

## Task 5: Extract Brand Palette and Typography from the Live Site

**Files:**
- Create: `docs/brand-tokens.md` (notes only, used by Task 6)

- [ ] **Step 1: Inspect live site styles**

Open `https://jaipurscloset.com/` in a browser. Using DevTools:

- Note `font-family` on `body`, `h1`, `h2`, buttons.
- Note hex values for: page background, body text, primary brand color, accent color, link color, button background, button text.
- Note Google Fonts URLs if present in `<head>` (`<link href="https://fonts.googleapis.com/...">`).

- [ ] **Step 2: Record tokens**

Write to `docs/brand-tokens.md`:

```markdown
# Brand Tokens (extracted from jaipurscloset.com)

## Colors
- `--color-bg`: #FFFFFF
- `--color-text`: #1A1A1A
- `--color-primary`: #<brand primary>
- `--color-accent`: #<brand accent>
- `--color-muted`: #7A7A7A
- `--color-border`: #E5E5E5

## Typography
- Heading font: `<exact family name>` (Google Fonts URL: ...)
- Body font: `<exact family name>` (Google Fonts URL: ...)
- Base size: 16px
- Scale: 1.25 (major third)

## Notes
- Hover states, button radii, shadows — capture if obvious from inspection.
```

Replace placeholders with actual observed values. If a value cannot be observed, pick a sensible default and note it.

- [ ] **Step 3: Commit**

```bash
git add docs/brand-tokens.md
git commit -m "docs: capture brand color and typography tokens from existing theme"
```

---

## Task 6: `index.html` Skeleton with Meta, JSON-LD, and Section Stubs

**Files:**
- Create: `index.html`

- [ ] **Step 1: Write `index.html`**

Write to `index.html` (replace `<BRAND_PRIMARY_FONT>`, `<BRAND_BODY_FONT>`, and the Google Fonts URL with values from `docs/brand-tokens.md`; replace `WHATSAPP_NUMBER` with the literal placeholder string for later substitution):

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <title>Jaipur's Closet — Handcrafted Jaipuri Fashion | Shop on Instagram</title>
  <meta name="description" content="Jaipur's Closet brings you handcrafted Jaipuri suits, block-print and bandhani ethnic wear. Shop our latest collections directly on Instagram.">
  <meta name="keywords" content="jaipuri suits, block print, bandhani, ethnic wear, hand-printed cotton, jaipur fashion, indian ethnic wear">
  <meta name="author" content="Jaipur's Closet">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://jaipurscloset.com/">

  <!-- Open Graph -->
  <meta property="og:title" content="Jaipur's Closet — Handcrafted Jaipuri Fashion">
  <meta property="og:description" content="Handcrafted Jaipuri suits, block-print and bandhani ethnic wear. Shop on Instagram.">
  <meta property="og:image" content="https://jaipurscloset.com/assets/icons/og-image.jpg">
  <meta property="og:url" content="https://jaipurscloset.com/">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Jaipur's Closet">
  <meta property="og:locale" content="en_IN">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Jaipur's Closet — Handcrafted Jaipuri Fashion">
  <meta name="twitter:description" content="Handcrafted Jaipuri suits, block-print and bandhani ethnic wear. Shop on Instagram.">
  <meta name="twitter:image" content="https://jaipurscloset.com/assets/icons/og-image.jpg">

  <!-- Icons -->
  <link rel="icon" href="/assets/icons/favicon.ico" sizes="any">
  <link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="<GOOGLE_FONTS_URL>">

  <!-- Styles -->
  <link rel="stylesheet" href="/style.css">

  <!-- JSON-LD: Organization + LocalBusiness -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Store",
    "name": "Jaipur's Closet",
    "description": "Handcrafted Jaipuri suits, block-print and bandhani ethnic wear.",
    "url": "https://jaipurscloset.com/",
    "logo": "https://jaipurscloset.com/assets/icons/icon-512.png",
    "image": "https://jaipurscloset.com/assets/icons/og-image.jpg",
    "telephone": "+WHATSAPP_NUMBER",
    "sameAs": [
      "https://www.instagram.com/jaipurscloset/",
      "https://wa.me/WHATSAPP_NUMBER"
    ]
  }
  </script>

  <!-- JSON-LD: BreadcrumbList -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://jaipurscloset.com/" },
      { "@type": "ListItem", "position": 2, "name": "About", "item": "https://jaipurscloset.com/#about" },
      { "@type": "ListItem", "position": 3, "name": "Collections", "item": "https://jaipurscloset.com/#collections" },
      { "@type": "ListItem", "position": 4, "name": "Contact", "item": "https://jaipurscloset.com/#contact" }
    ]
  }
  </script>
</head>
<body>
  <header class="site-header">
    <nav class="nav" aria-label="Primary">
      <a class="nav-logo" href="#top" aria-label="Jaipur's Closet home">Jaipur's Closet</a>
      <button class="nav-toggle" aria-expanded="false" aria-controls="nav-menu" aria-label="Toggle menu">
        <span></span><span></span><span></span>
      </button>
      <ul id="nav-menu" class="nav-menu">
        <li><a href="#about">About</a></li>
        <li><a href="#collections">Collections</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
    </nav>
  </header>

  <main id="top">
    <section class="hero" aria-label="Hero">
      <div class="hero-media">
        <img src="/assets/images/hero.webp" alt="Hand block-printed Jaipuri ethnic wear from Jaipur's Closet" width="1600" height="900">
      </div>
      <div class="hero-content">
        <h1>Jaipur's Closet</h1>
        <p class="tagline">Handcrafted Jaipuri fashion, straight from our studio to your wardrobe.</p>
        <a class="btn btn-primary" href="https://www.instagram.com/jaipurscloset/" target="_blank" rel="noopener">Shop on Instagram</a>
      </div>
    </section>

    <section id="about" class="section about" aria-label="About">
      <div class="container two-col">
        <div class="about-text">
          <h2>About Us</h2>
          <p><!-- ABOUT_COPY_FROM_SHOPIFY --></p>
        </div>
        <div class="about-media">
          <img src="/assets/images/about.webp" alt="Artisans at work crafting Jaipur's Closet ethnic wear" width="1200" height="900" loading="lazy">
        </div>
      </div>
    </section>

    <section id="collections" class="section collections" aria-label="Collections">
      <div class="container">
        <h2>Collections</h2>
        <p class="section-intro">Browse our signature lines. To order, DM us on Instagram.</p>
        <ul class="collection-grid">
          <li class="collection-tile">
            <a href="https://ig.me/m/jaipurscloset" target="_blank" rel="noopener">
              <img src="/assets/images/collections/1.webp" alt="Block-print suits collection" width="800" height="800" loading="lazy">
              <span class="collection-name">Block Print Suits</span>
            </a>
          </li>
          <li class="collection-tile">
            <a href="https://ig.me/m/jaipurscloset" target="_blank" rel="noopener">
              <img src="/assets/images/collections/2.webp" alt="Bandhani collection" width="800" height="800" loading="lazy">
              <span class="collection-name">Bandhani</span>
            </a>
          </li>
          <li class="collection-tile">
            <a href="https://ig.me/m/jaipurscloset" target="_blank" rel="noopener">
              <img src="/assets/images/collections/3.webp" alt="Cotton kurtas collection" width="800" height="800" loading="lazy">
              <span class="collection-name">Cotton Kurtas</span>
            </a>
          </li>
          <li class="collection-tile">
            <a href="https://ig.me/m/jaipurscloset" target="_blank" rel="noopener">
              <img src="/assets/images/collections/4.webp" alt="Festive wear collection" width="800" height="800" loading="lazy">
              <span class="collection-name">Festive Wear</span>
            </a>
          </li>
        </ul>
        <p class="collection-note">Final collection names will be confirmed from the scraped Shopify navigation.</p>
      </div>
    </section>

    <section id="contact" class="section contact" aria-label="Contact">
      <div class="container">
        <h2>Contact</h2>
        <p>The fastest way to reach us is on Instagram. Slide into our DMs and we'll help you place your order.</p>
        <div class="contact-actions">
          <a class="btn btn-primary" href="https://ig.me/m/jaipurscloset" target="_blank" rel="noopener" aria-label="Direct message Jaipur's Closet on Instagram">Instagram DM</a>
          <a class="btn btn-secondary" href="https://wa.me/WHATSAPP_NUMBER" target="_blank" rel="noopener" aria-label="Message Jaipur's Closet on WhatsApp">WhatsApp</a>
        </div>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="container footer-inner">
      <p>&copy; <span id="year">2026</span> Jaipur's Closet. Shop via Instagram DM.</p>
      <ul class="social">
        <li><a href="https://www.instagram.com/jaipurscloset/" target="_blank" rel="noopener" aria-label="Instagram">Instagram</a></li>
        <li><a href="https://wa.me/WHATSAPP_NUMBER" target="_blank" rel="noopener" aria-label="WhatsApp">WhatsApp</a></li>
      </ul>
    </div>
  </footer>

  <script src="/script.js" defer></script>
</body>
</html>
```

- [ ] **Step 2: Validate the HTML**

Open `index.html` in a browser. Verify:
- No broken layout (will look unstyled — that's expected until Task 7).
- DevTools Console shows no 404s for `/style.css`, `/script.js`, image paths, manifest, or fonts (404 for `style.css` and `script.js` is expected at this step — note it; everything else must resolve).
- Right-click → View Source: `<title>`, meta description, JSON-LD blocks are present.

Run W3C validator on the file contents at `https://validator.w3.org/nu/#textarea`. Expected: zero errors (warnings about empty `<p>` for `ABOUT_COPY_FROM_SHOPIFY` are acceptable until Task 9).

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(html): add index.html with meta, JSON-LD, nav, hero, about, collections, contact, footer"
```

---

## Task 7: `style.css` — Tokens, Layout, Components, Responsive

**Files:**
- Create: `style.css`

- [ ] **Step 1: Write `style.css`**

Write to `style.css` (replace `<HEADING_FONT>` and `<BODY_FONT>` with values from `docs/brand-tokens.md`; replace color tokens accordingly):

```css
:root {
  --color-bg: #FFFFFF;
  --color-text: #1A1A1A;
  --color-primary: #B23A48;
  --color-accent: #D4A373;
  --color-muted: #7A7A7A;
  --color-border: #E5E5E5;

  --font-heading: "<HEADING_FONT>", Georgia, serif;
  --font-body: "<BODY_FONT>", system-ui, -apple-system, sans-serif;

  --space-1: 0.5rem;
  --space-2: 1rem;
  --space-3: 1.5rem;
  --space-4: 2rem;
  --space-5: 3rem;
  --space-6: 4rem;

  --container-max: 1200px;
  --radius: 4px;
  --shadow: 0 2px 8px rgba(0,0,0,0.08);
}

*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  font-family: var(--font-body);
  color: var(--color-text);
  background: var(--color-bg);
  line-height: 1.6;
  font-size: 16px;
}

img { max-width: 100%; height: auto; display: block; }
a { color: var(--color-primary); text-decoration: none; }
a:hover { text-decoration: underline; }

h1, h2, h3 { font-family: var(--font-heading); line-height: 1.2; margin: 0 0 var(--space-2); }
h1 { font-size: clamp(2rem, 5vw, 3.5rem); }
h2 { font-size: clamp(1.5rem, 3vw, 2.25rem); margin-bottom: var(--space-3); }

.container { max-width: var(--container-max); margin: 0 auto; padding: 0 var(--space-3); }

/* Header & Nav */
.site-header {
  position: sticky;
  top: 0;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  z-index: 100;
}
.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: var(--container-max);
  margin: 0 auto;
  padding: var(--space-2) var(--space-3);
}
.nav-logo {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text);
}
.nav-logo:hover { text-decoration: none; color: var(--color-primary); }
.nav-menu {
  display: flex;
  gap: var(--space-3);
  list-style: none;
  margin: 0;
  padding: 0;
}
.nav-menu a {
  color: var(--color-text);
  font-weight: 500;
}
.nav-toggle {
  display: none;
  flex-direction: column;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--space-1);
}
.nav-toggle span {
  display: block;
  width: 24px;
  height: 2px;
  background: var(--color-text);
}

/* Buttons */
.btn {
  display: inline-block;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius);
  font-weight: 600;
  text-align: center;
  transition: opacity 0.2s, transform 0.2s;
}
.btn:hover { text-decoration: none; opacity: 0.9; transform: translateY(-1px); }
.btn-primary { background: var(--color-primary); color: #fff; }
.btn-secondary { background: var(--color-accent); color: var(--color-text); }

/* Hero */
.hero {
  position: relative;
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.hero-media {
  position: absolute;
  inset: 0;
  z-index: 0;
}
.hero-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.hero-media::after {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.35);
}
.hero-content {
  position: relative;
  z-index: 1;
  text-align: center;
  color: #fff;
  padding: var(--space-5) var(--space-3);
  max-width: 720px;
}
.hero-content h1 { color: #fff; }
.tagline {
  font-size: 1.125rem;
  margin: 0 0 var(--space-3);
  opacity: 0.95;
}

/* Sections */
.section { padding: var(--space-6) 0; }
.section-intro {
  color: var(--color-muted);
  margin-bottom: var(--space-4);
}
.two-col {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
  align-items: center;
}

/* Collections */
.collection-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);
}
.collection-tile {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}
.collection-tile a {
  display: block;
  position: relative;
  color: #fff;
}
.collection-tile img {
  width: 100%;
  height: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  transition: transform 0.3s;
}
.collection-tile a:hover img { transform: scale(1.04); }
.collection-tile a:hover { text-decoration: none; }
.collection-name {
  position: absolute;
  inset: auto 0 0 0;
  padding: var(--space-3);
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  font-family: var(--font-heading);
  font-size: 1.25rem;
}
.collection-note {
  color: var(--color-muted);
  font-size: 0.875rem;
  margin-top: var(--space-3);
}

/* Contact */
.contact-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-3);
}

/* Footer */
.site-footer {
  border-top: 1px solid var(--color-border);
  padding: var(--space-4) 0;
  color: var(--color-muted);
  font-size: 0.875rem;
}
.footer-inner {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2);
}
.social {
  display: flex;
  gap: var(--space-3);
  list-style: none;
  margin: 0;
  padding: 0;
}

/* Responsive */
@media (max-width: 767px) {
  .nav-toggle { display: flex; }
  .nav-menu {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    flex-direction: column;
    gap: 0;
    background: var(--color-bg);
    border-bottom: 1px solid var(--color-border);
    padding: var(--space-2);
    display: none;
  }
  .nav-menu.is-open { display: flex; }
  .nav-menu li { padding: var(--space-1) 0; }
}

@media (min-width: 768px) {
  .two-col { grid-template-columns: 1fr 1fr; gap: var(--space-5); }
  .collection-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1024px) {
  .collection-grid { grid-template-columns: repeat(4, 1fr); }
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { transition: none !important; animation: none !important; }
}
```

- [ ] **Step 2: Preview in browser**

Open `index.html`. Verify:
- Sticky nav visible at top, anchor links navigate to sections smoothly.
- Hero image fills viewport, overlay text readable.
- About section is single-column on mobile width (< 768px), two-column on desktop.
- Collection grid: 1 col mobile, 2 cols tablet, 4 cols desktop.
- Resize browser through 320 → 768 → 1024 → 1440 widths. No horizontal scrollbars.

- [ ] **Step 3: Commit**

```bash
git add style.css
git commit -m "style: add design tokens, layout, components, responsive breakpoints"
```

---

## Task 8: `script.js` — Smooth Scroll and Mobile Nav Toggle

**Files:**
- Create: `script.js`

- [ ] **Step 1: Write `script.js`**

Write to `script.js`:

```javascript
(() => {
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.getElementById('nav-menu');

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    menu.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        menu.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
})();
```

- [ ] **Step 2: Verify in browser**

Open `index.html`. Resize to mobile width (< 768px):
- Tap hamburger — menu drops down, `aria-expanded` flips to `true` in DevTools.
- Tap a menu link — menu closes and page scrolls to anchor.
- Footer year displays current year.

- [ ] **Step 3: Commit**

```bash
git add script.js
git commit -m "feat(js): add mobile nav toggle and dynamic footer year"
```

---

## Task 9: Fill Real About Copy from Scrape

**Files:**
- Modify: `index.html` (the `<p>` inside `.about-text`, currently `<!-- ABOUT_COPY_FROM_SHOPIFY -->`)

- [ ] **Step 1: Pull About copy**

Open `https://jaipurscloset.com/pages/about` in a browser. Copy the body paragraphs verbatim.

If `/pages/about` 404s, fall back to whatever brand description appears on the homepage. If nothing usable exists, write a 2-3 sentence placeholder matching the brand voice (Jaipuri heritage, handcrafted, family-run) and note this in `docs/brand-tokens.md` under "Open Items".

- [ ] **Step 2: Replace the placeholder in `index.html`**

Find:

```html
          <p><!-- ABOUT_COPY_FROM_SHOPIFY --></p>
```

Replace with the scraped or written copy, wrapping into one or more `<p>` elements:

```html
          <p>[First paragraph of scraped/written About copy]</p>
          <p>[Second paragraph, if applicable]</p>
```

- [ ] **Step 3: Verify**

Reload `index.html`. About section shows real copy. No HTML entities visible as plain text (`&amp;` → `&`, etc.).

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "content(about): fill About section copy from existing shopify page"
```

---

## Task 10: `robots.txt` and `sitemap.xml`

**Files:**
- Create: `robots.txt`
- Create: `sitemap.xml`

- [ ] **Step 1: Create `robots.txt`**

Write to `robots.txt`:

```
User-agent: *
Allow: /

Sitemap: https://jaipurscloset.com/sitemap.xml
```

- [ ] **Step 2: Create `sitemap.xml`**

Write to `sitemap.xml` (replace `<TODAY>` with current ISO date, e.g., `2026-05-24`):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://jaipurscloset.com/</loc>
    <lastmod><TODAY></lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

- [ ] **Step 3: Validate**

Confirm `robots.txt` resolves at `/robots.txt` when served (after deploy in Task 12). For now, open both files in a browser locally — they should render as plain text/XML without errors.

Validate sitemap structure at `https://www.xml-sitemaps.com/validate-xml-sitemap.html` after deploy.

- [ ] **Step 4: Commit**

```bash
git add robots.txt sitemap.xml
git commit -m "feat(seo): add robots.txt and sitemap.xml"
```

---

## Task 11: Final SEO and Accessibility Audit

**Files:**
- Modify: `index.html` (if audit finds issues)
- Modify: `style.css` (if audit finds contrast issues)

- [ ] **Step 1: Run Lighthouse**

Open `index.html` in Chrome (or serve via `npx serve .`). Open DevTools → Lighthouse → run audits for Performance, Accessibility, Best Practices, SEO on Mobile.

Expected scores:
- Performance ≥ 90
- Accessibility ≥ 95
- Best Practices ≥ 95
- SEO = 100

- [ ] **Step 2: Fix any failing checks**

Common fixes:
- Missing `lang` on `<html>` → already set to `"en"`
- Image without `alt` → add descriptive alt
- Low contrast → adjust `--color-muted` against `--color-bg`
- Tap targets too small → enforce min 44×44px on `.btn` and nav links via padding
- Missing `width`/`height` on images → already set in Task 6; add for any new images

Apply fixes inline; do not invent new files.

- [ ] **Step 3: Validate JSON-LD**

Copy each `<script type="application/ld+json">` block into `https://search.google.com/test/rich-results` (paste-as-code option). Expected: no errors. Warnings about optional fields are OK.

- [ ] **Step 4: Validate HTML**

Paste full `index.html` into `https://validator.w3.org/nu/#textarea`. Expected: zero errors.

- [ ] **Step 5: Commit any fixes**

```bash
git add index.html style.css
git commit -m "fix(seo): address lighthouse and accessibility findings"
```

If no fixes needed, skip this commit.

---

## Task 12: GitHub Actions Deploy Workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create the workflow file**

Write to `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Configure repo settings**

In GitHub:
1. Settings → Pages → Source → "GitHub Actions".
2. Settings → Pages → Custom domain → enter `jaipurscloset.com` once DNS is ready (skip until then; `CNAME` file already records intent).

- [ ] **Step 3: Push and verify deploy**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Pages deploy workflow"
git push origin main
```

Watch Actions tab. Expected: `Deploy to GitHub Pages` runs green, outputs a `https://<user>.github.io/<repo>/` URL.

- [ ] **Step 4: Smoke test deployed site**

Open the deployed URL. Verify:
- Hero loads with image and CTA
- Anchor nav scrolls to each section
- Instagram and WhatsApp buttons open correct URLs (WhatsApp will fail until placeholder replaced — expected)
- `/robots.txt` and `/sitemap.xml` resolve
- DevTools Network: no 404s for CSS/JS/images/manifest/favicons

---

## Task 13: WhatsApp Number Substitution Procedure (documented for later)

**Files:**
- Modify: `README.md` (already covered in Task 1 — verify section is present)

- [ ] **Step 1: Confirm README documents the substitution**

Open `README.md`. Verify the "Contact Channels" section instructs to search-replace `WHATSAPP_NUMBER` once a number is provided. If missing, add:

```markdown
## Updating the WhatsApp Number

When the WhatsApp number is finalized, search the repo for `WHATSAPP_NUMBER` and replace each occurrence with the international-format digits only (no `+`, no spaces). Files affected: `index.html`. Commit and push — auto-deploys.
```

- [ ] **Step 2: Commit if README was updated**

```bash
git add README.md
git commit -m "docs: add WhatsApp number substitution instructions"
```

---

## Self-Review (already completed before handoff)

Spec coverage:
- Sections (Hero, About, Collections, Contact, Footer) → Task 6
- Sticky nav + smooth scroll + mobile toggle → Tasks 6, 7, 8
- Theme parity (palette + fonts) → Tasks 5, 7
- WebP + lazy + width/height → Tasks 3, 6
- SEO meta, OG, Twitter, canonical → Task 6
- JSON-LD (Store, BreadcrumbList) → Task 6
- Favicons + manifest + OG image → Task 4
- robots.txt + sitemap.xml → Task 10
- Semantic HTML + headings + alt + aria → Tasks 6, 11
- Lighthouse targets → Task 11
- GitHub Pages deploy via Actions → Task 12
- CNAME placeholder → Task 1
- One-shot scrape script → Task 2
- WhatsApp placeholder + substitution guide → Tasks 6, 13
- About copy scraped → Task 9

Placeholder scan: `WHATSAPP_NUMBER` is an intentional placeholder, documented in Tasks 6 and 13. `<GOOGLE_FONTS_URL>`, `<HEADING_FONT>`, `<BODY_FONT>` are resolved inside Task 6 step 1 by reading `docs/brand-tokens.md` produced in Task 5. No other unresolved placeholders.

Type/name consistency: nav anchors (`#about`, `#collections`, `#contact`) match between `index.html`, `style.css`, JSON-LD BreadcrumbList, and JS smooth-scroll. CSS class names referenced from JS (`.nav-toggle`, `#nav-menu`, `is-open`, `#year`) match HTML.
