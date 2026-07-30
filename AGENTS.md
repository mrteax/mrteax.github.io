## Cursor Cloud specific instructions

This repository is **Tea X 工具箱** — a static toolbox homepage deployed at `mrteax.github.io` via GitHub Pages. It uses vanilla HTML, CSS, and JavaScript with no build tools or package managers.

### Running the site

Serve the repository root with any static HTTP server:

```bash
python3 -m http.server 8080
```

### Verification

Run the static regression checker (Node standard library only):

```bash
node scripts/check-site.mjs
```

It validates HTML asset links, JavaScript syntax, dataset counts, forbidden remote-tracking strings, key copy on portal and France guide pages, and absence of obsolete files.

### Structure

- `index.html` — minimal landing page (Beside Me cigarette pack SVG, links to portal)
- `portal.html` — main Tea X homepage (clock, daily picks, theme cards, AI usage budget)
- `tools.html` — developer utilities page
- Theme and reference pages — `tea.html`, `coffee.html`, `hiking.html`, `fitness.html`, `tennis.html`, `skiing.html`, `surfing.html`, `billiards.html`, `cocktails.html`, `games.html`, plus private notes `health.html`, `france-schengen-2026.html`, `cursor-usage-bookmarklet.html`
- `css/landing.css` — landing page styles
- `css/home.css` — portal homepage styles, including dark mode via `[data-theme="dark"]`
- `css/tools.css`, `css/themes.css`, `css/theme.css`, and per-page CSS under `css/` (e.g. `games.css`, `cocktails.css`)
- `js/home.js` — portal logic: theme, particles, clock, world times, daily quote/modals, local visit-count greeting, AI usage budget (localStorage only)
- `js/tools.js` — tools page: timer, notes, JSON, Base64, timestamp, color, password, text case, URL encode/decode, SHA-256 hash, regex test
- `js/games.js` — chess and other mini-games (ES module)
- `js/theme-icons.js` — shared theme icon / inheritance helper
- `js/*-data.js` — static content arrays loaded by portal or theme pages (`hiking-data.js`, `fitness-data.js`, `tennis-data.js`, `skiing-data.js`, `surfing-data.js`, `billiards-data.js`, `tea-data.js`, `coffee-data.js`, `cocktails-data.js`, plus `cocktails-page.js` for the cocktails UI)

### Privacy and data

- User-specific state stays in the browser: `localStorage` for theme, tools notes (`teax_notes`), portal visit count (`teax_visits`), AI usage (`teax_ai_usage_v1`), chess history, and health import history (`teax_health_history` on `health.html`).
- `health.html` is local-only (no cloud sync); it uses `noindex,nofollow`. Health JSON is parsed and stored only in the current browser.
- Removed from production: open-meteo weather on the portal, the public visitor map page (`visitors.html`) and its geolocation script (removed from `js/`), and Supabase-backed health or visitor remote reads. Do not reintroduce these without an explicit product decision.
- Personal pages (`health.html`, `france-schengen-2026.html`, `cursor-usage-bookmarklet.html`) use `noindex,nofollow`; that is not access control.

### External dependencies

The site is mostly static, but some pages load third-party resources at runtime (do not document it as “no external APIs”):

- **Google Fonts** — Noto Sans SC, JetBrains Mono (and Reenie Beanie on the landing page) from `fonts.googleapis.com` / `fonts.gstatic.com`
- **TheCocktailDB** — cocktail thumbnail URLs embedded in `js/cocktails-data.js` (browser fetches images from `thecocktaildb.com`)
- **jsDelivr** — `chess.js` imported as ESM in `js/games.js` (`cdn.jsdelivr.net`)
- **User-initiated links** — e.g. map search URLs on `cocktails.html`, official visa links on `france-schengen-2026.html`

There is no site-owned backend API. `crypto.subtle` is used for SHA-256 on the tools page (requires HTTPS or localhost).

### Key notes

- No npm install or bundler; deploy is static files to GitHub Pages (`docs/github-pages-deploy.md`, `scripts/deploy-pages.sh`).
- Portal loads a subset of `*-data.js` for daily picks; individual theme pages load their own data scripts. `coffee-data.js` is not loaded on `portal.html`.
