# Jaipur's Closet — Static 1-Pager Design Spec

**Date:** 2026-05-24
**Owner:** abhishek.jain@airlinq.com
**Status:** Approved, ready for implementation plan

## 1. Purpose

Replace the existing Shopify storefront at `https://jaipurscloset.com/` with a static, single-page informational website. Sales moved to Instagram (`https://www.instagram.com/jaipurscloset/`); customers order via Instagram DM. The site must preserve the existing Shopify theme's visual identity, expose key brand information, and route all purchase intent to Instagram.

## 2. Scope

### In Scope
- Single `index.html` with anchored sections and sticky top nav
- Visual parity with current Shopify theme (colors, typography, hero imagery)
- Scrape copy and images from `https://jaipurscloset.com/` (home, /pages/about, /pages/contact)
- SEO meta, Open Graph, Twitter Card, JSON-LD schema, robots.txt, sitemap.xml, favicons
- GitHub Pages hosting with auto-deploy via GitHub Actions
- Responsive mobile-first layout

### Out of Scope
- Product listings, cart, checkout, payments
- CMS / admin interface
- Contact forms (Instagram DM and WhatsApp only)
- Analytics, cookies, consent banner
- Instagram content scraping (login-walled, fragile)
- Google Search Console verification (added by owner post-deploy)

## 3. Architecture

- Plain HTML5 + CSS3 + vanilla JS. No framework, no build step required for development.
- Hosted on GitHub Pages from `main` branch root.
- Auto-deploy via GitHub Actions on push to `main`.
- Custom domain ready via `CNAME` file (placeholder until DNS configured).

## 4. Page Sections

Single `index.html` containing the following anchored sections:

1. **Sticky Top Nav** — logo left; anchor links right: About, Collections, Contact. Smooth-scroll behavior via JS. Hamburger toggle below 768px.
2. **Hero** — full-width scraped banner image, brand name `<h1>`, tagline, primary CTA button linking to Instagram profile.
3. **About** (`#about`) — copy scraped from `/pages/about`, single column, supporting image right or below.
4. **Collections** (`#collections`) — responsive grid of category name tiles. Each tile shows category name over background image. Tiles link to Instagram DM intent: `https://ig.me/m/jaipurscloset`. No product listings.
5. **Contact** (`#contact`) — Instagram DM button + WhatsApp button (`https://wa.me/<PLACEHOLDER>`). Location text if scraped. Number to be provided later — placeholder string `WHATSAPP_NUMBER_TBD` until then.
6. **Footer** — social icons (Instagram, WhatsApp), copyright, line "Shop via Instagram DM".

## 5. Styling

- Extract palette and typography from live Shopify site:
  - Pull computed styles from key elements (body, headings, buttons, links) on `https://jaipurscloset.com/`
  - Define brand colors as CSS custom properties in `:root`
- If theme uses Google Fonts, load via `<link rel="preconnect">` + `<link rel="stylesheet">`. Otherwise self-host in `assets/fonts/` with `@font-face`.
- Mobile-first responsive. Breakpoints: 768px (tablet), 1024px (desktop).
- Target ~300 lines of CSS, minified for production.

## 6. JavaScript Scope

Minimal vanilla JS only:
- Smooth-scroll handler for anchor links
- Mobile nav hamburger toggle
- No analytics, no tracking, no third-party scripts

## 7. SEO Requirements

### Meta Tags (`<head>`)
- `<title>` — "Jaipur's Closet — Handcrafted Jaipuri Fashion | Shop on Instagram"
- `<meta name="description">` — 150-160 character brand summary
- `<meta name="keywords">` — jaipuri suits, block print, bandhani, ethnic wear, hand-printed cotton, Jaipur fashion (final list during implementation)
- `<meta name="author">`, `<meta name="robots" content="index, follow">`
- `<meta charset="UTF-8">`, `<meta name="viewport" content="width=device-width, initial-scale=1">`
- Canonical: `<link rel="canonical" href="https://jaipurscloset.com/">`

### Open Graph
- `og:title`, `og:description`, `og:image` (1200×630), `og:url`, `og:type=website`, `og:site_name=Jaipur's Closet`, `og:locale=en_IN`

### Twitter Card
- `summary_large_image` with title, description, image

### Favicons & Manifest
- `favicon.ico`
- `apple-touch-icon.png` (180×180)
- `icon-192.png`, `icon-512.png`
- `site.webmanifest`

### JSON-LD Schema (`<script type="application/ld+json">`)
- `LocalBusiness` or `Store` — name, description, image, url, sameAs (Instagram, WhatsApp), address (if available), telephone
- `Organization` — logo, social profiles
- `BreadcrumbList` for in-page anchor sections

### Crawlability
- `robots.txt` — `User-agent: *` / `Allow: /` / `Sitemap: https://jaipurscloset.com/sitemap.xml`
- `sitemap.xml` — single URL, lastmod date, priority 1.0

### Semantic HTML
- `<header>`, `<nav>`, `<main>`, `<section id="...">`, `<footer>`
- One `<h1>` (hero only), `<h2>` per section, proper heading hierarchy

### Performance (Ranking Factor)
- WebP images with explicit `width` and `height` attributes (CLS prevention)
- `<img loading="lazy">` for below-fold images
- `<link rel="preconnect">` for Google Fonts origin
- Minified CSS/JS via GitHub Actions step before deploy

### Accessibility (SEO-adjacent)
- Descriptive, keyword-rich `alt` text on all images (e.g., "Hand block-printed cotton suit from Jaipur's Closet")
- `aria-label` on icon-only buttons
- WCAG AA color contrast (4.5:1 normal text, 3:1 large text)
- All interactive elements keyboard accessible

## 8. Asset Pipeline

- One-shot scrape script `scripts/scrape.mjs` (Node), run locally once:
  - Downloads hero, about-section, and collection thumbnail images from jaipurscloset.com
  - Saves originals to `assets/images/_raw/` for reference
- Manual WebP conversion via `cwebp` or equivalent:
  - Max width 1600px, target <200KB per image
  - JPG fallback retained for older-browser support if needed (optional, defer until shown necessary)
- All assets committed to repo (no CDN dependency).

## 9. Repository Structure

```
/
├── index.html
├── style.css
├── script.js
├── robots.txt
├── sitemap.xml
├── site.webmanifest
├── favicon.ico
├── CNAME                          (placeholder)
├── README.md                      (deploy + edit guide)
├── .github/workflows/
│   └── deploy.yml                 (GitHub Pages action)
├── scripts/
│   └── scrape.mjs                 (one-shot asset scraper)
├── assets/
│   ├── icons/
│   │   ├── apple-touch-icon.png
│   │   ├── icon-192.png
│   │   ├── icon-512.png
│   │   └── og-image.jpg
│   ├── images/
│   │   ├── _raw/                  (originals, gitignored optional)
│   │   ├── hero.webp
│   │   ├── about.webp
│   │   └── collections/
│   └── fonts/                     (if self-hosted)
└── docs/
    └── superpowers/specs/
        └── 2026-05-24-jaipurscloset-static-design.md
```

## 10. Deploy

- GitHub Actions workflow `.github/workflows/deploy.yml`:
  - Trigger: push to `main`
  - Steps: checkout, minify CSS/JS (optional via `actions/setup-node` + `terser`/`csso`), deploy via `actions/deploy-pages@v4`
- README documents: edit copy in `index.html`, commit, auto-deploys.
- Custom domain configured later: update `CNAME`, point DNS A/CNAME records, enable HTTPS in repo settings.

## 11. Open Items (resolve during implementation)

- WhatsApp number — owner to provide; substitute `WHATSAPP_NUMBER_TBD` until then
- Final keyword list for meta description and `meta name="keywords"`
- Collection category names — confirm list from scraped nav
- Brand address (if shown on contact page) — include in LocalBusiness schema
- Decision on JPG fallbacks for WebP — defer until browser-support concern surfaces

## 12. Success Criteria

- Site loads under 1.5s on 4G (Lighthouse Performance ≥ 90)
- Lighthouse SEO score 100
- Lighthouse Accessibility score ≥ 95
- Visual parity with current Shopify theme (subjective owner approval)
- All Instagram/WhatsApp CTAs functional on mobile and desktop
- Valid HTML5 (W3C validator), valid JSON-LD (Google Rich Results Test)
- Indexable by Google (verify robots.txt, sitemap.xml, canonical tag)
