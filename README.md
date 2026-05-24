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

## Updating the WhatsApp Number

When the WhatsApp number is finalized, search the repo for `WHATSAPP_NUMBER` and replace each occurrence with the international-format digits only (no `+`, no spaces, no dashes — e.g., `919876543210` for India +91 98765 43210).

Files affected: `index.html` (button hrefs + JSON-LD `telephone` field).

Use:
```bash
grep -rln WHATSAPP_NUMBER .
# then replace each occurrence in index.html
```

Commit and push — auto-deploys via GitHub Actions.
