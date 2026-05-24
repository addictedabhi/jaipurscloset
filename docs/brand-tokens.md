# Brand Tokens (extracted from jaipurscloset.com)

> Source of values: observed from live site HTML/CSS dated 2026-05-24.
> Colors extracted from Shopify Dawn theme settings JSON embedded in homepage, supplemented
> by sharp-based average-color sampling of logo and product images in `assets/images/_raw/`.
> Typography extracted from self-hosted `@font-face` declarations in the theme CSS.
> Fields marked **(defaulted)** where no signal was found.

---

## Colors

| Token | Value | Notes |
|---|---|---|
| `--color-bg` | `#ffffff` | observed — `colors_background_1` from theme settings |
| `--color-bg-2` | `#f3f3f3` | observed — `colors_background_2` (cards, alternating sections) |
| `--color-text` | `#000000` | observed — `colors_text` from theme settings |
| `--color-primary` | `#000000` | observed — `colors_accent_1`; used as primary button fill |
| `--color-accent` | `#334fb4` | observed — `colors_accent_2`; sale badge / secondary accent |
| `--color-muted` | `#d9d9d9` | observed — recurring in CSS (borders, disabled states) |
| `--color-border` | `#e4e4e4` | observed — recurring in CSS (dividers) |
| `--color-button-label` | `#ffffff` | observed — `colors_solid_button_labels` |
| `--color-outline-button` | `#000000` | observed — `colors_outline_button_labels` |

### Image-derived palette (sharp average-color sampling)

| Image | Average hex | Role |
|---|---|---|
| `jaipur_s_-01_1_1.png` (logo) | `#982257` | deep magenta/maroon — brand logo dominant |
| `Rectangle_4.png` (hero/banner) | `#ad906b` | warm sand/tan — hero background |
| `Rectangle_3.png` (section bg) | `#e7e4df` | off-white/linen — light section background |
| `jewellery.jpg` | `#3c2818` | dark espresso brown — product photography base |

> The logo's `#982257` magenta is not directly present in the CSS theme settings but is
> visible in the brand mark. Consider using it as a highlight/hover color in the static site.

---

## Typography

- **Heading font**: `Crimson Pro` — self-hosted (`/cdn/shop/files/CrimsonPro-Regular.woff2`, `CrimsonPro-SemiBold.woff2`); weights 400 and 700 (600 SemiBold mapped to 700)
- **Body font**: `Montserrat` — self-hosted (`/cdn/shop/files/Montserrat-Regular.woff2`, `Montserrat-Medium.woff2`); weights 400 and 500
- **Icon font**: `sanity` — self-hosted custom icon font (not a web font service)
- **Base size**: 16px **(defaulted — Dawn theme standard; no explicit override observed)**
- **Scale**: 1.25 — Major Third **(defaulted — reasonable for Crimson Pro / Montserrat pairing)**
- **Heading scale setting**: `100` (no zoom applied in theme settings — 1:1 default)

### Google Fonts URL

Neither `Crimson Pro` nor `Montserrat` is loaded from Google Fonts on this site — both are
self-hosted WOFF2/WOFF files served from `jaipurscloset.com/cdn/shop/files/`. For the
static site `index.html`, use Google Fonts as a CDN equivalent:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600&family=Montserrat:wght@400;500;600&display=swap" rel="stylesheet">
```

**Combined Google Fonts URL:**
```
https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600&family=Montserrat:wght@400;500;600&display=swap
```

---

## CSS Custom Properties (for index.html `<style>`)

```css
:root {
  /* Colors — from Shopify Dawn theme settings */
  --color-bg:              #ffffff;
  --color-bg-2:            #f3f3f3;
  --color-text:            #000000;
  --color-primary:         #000000;
  --color-accent:          #334fb4;
  --color-accent-brand:    #982257;   /* logo magenta — image-sampled */
  --color-muted:           #d9d9d9;
  --color-border:          #e4e4e4;
  --color-button-label:    #ffffff;
  --color-sand:            #ad906b;   /* hero banner — image-sampled */
  --color-linen:           #e7e4df;   /* section bg — image-sampled */

  /* Typography */
  --font-heading:          'Crimson Pro', Georgia, serif;
  --font-body:             'Montserrat', Helvetica, Arial, sans-serif;
  --font-size-base:        16px;
  --type-scale:            1.25;
}
```

---

## Notes

- **Shopify theme observed**: Dawn v6.0.2 (theme store ID 887, schema version 6.0.2)
- **Myshopify domain**: `jaipur-closet.myshopify.com`
- No Google Fonts `<link>` tag was present in the live site — fonts are self-hosted WOFF2.
- `#ff007f` appeared 17 times in the CSS (hot pink) — this is a Globo Filter plugin UI color, not a brand color; excluded from tokens.
- `#fffdfd` (9 occurrences) is an off-white overlay variant, not distinct enough to token separately from `--color-bg`.
- Hover/focus: Dawn uses `rgba(var(--color-foreground), 0.08)` for subtle borders; `rgba(var(--color-foreground), 0.5)` for focus rings — effectively `rgba(0,0,0,0.08)` and `rgba(0,0,0,0.5)` given `--color-text: #000000`.
- Button shadow: disabled by default (`buttons_shadow_opacity: 0`); border radius 0px (sharp corners).
- Variant pills: border radius 40px (pill shape), border opacity 55%.
- Card style: `standard` with `background-2` color scheme (`#f3f3f3`).

### Items defaulted and why

| Token | Default used | Reason |
|---|---|---|
| `--font-size-base` | `16px` | Dawn `body_scale: 100` — no explicit px override found |
| `--type-scale` | `1.25` | No modular scale setting in theme; 1.25 suits serif/sans pairing |
