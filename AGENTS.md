## Cursor Cloud specific instructions

This repository is **Tea X 工具箱** — a static toolbox homepage deployed at `mrteax.github.io` via GitHub Pages. It uses vanilla HTML, CSS, and JavaScript with no build tools or package managers.

### Running the site

Serve the repository root with any static HTTP server:

```bash
python3 -m http.server 8080
```

### Structure

- `index.html` — minimal landing page (Beside Me cigarette pack, links to portal)
- `portal.html` — main Tea X homepage (greeting, daily picks, theme cards)
- `css/style.css` — all styles, including dark mode via `[data-theme="dark"]`
- `js/main.js` — all tool logic (clock, timer, notes, JSON, Base64, timestamp, color, password, text, URL encode, hash, regex)

### Key notes

- No build steps, linters, or automated tests
- All data stays in the user's browser (localStorage for notes, no external APIs)
- Google Fonts loaded via CDN (Noto Sans SC, JetBrains Mono)
- `crypto.subtle` used for SHA hashing (requires HTTPS or localhost)

