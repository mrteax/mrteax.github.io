## Cursor Cloud specific instructions

This repository is a **static personal homepage** (Tea X) for Jiannan Xiong, deployed at `mrteax.github.io` via GitHub Pages. It uses vanilla HTML, CSS, and JavaScript with no build tools or package managers.

### Running the site

Serve the repository root with any static HTTP server:

```bash
python3 -m http.server 8080
```

### Structure

- `index.html` — single-page homepage with all sections
- `css/style.css` — all styles, including dark mode via `[data-theme="dark"]`
- `js/main.js` — all interactivity (theme toggle, typing effect, GitHub API fetch, tea timer, scroll animations)

### Key features

- **Theme toggle** (light/dark) — persisted in `localStorage`
- **GitHub projects** — fetched live from `api.github.com/users/mrteax/repos`
- **Tea timer** — interactive Pomodoro-style timer with audio notification
- **Typing effect** — rotating taglines in the hero section
- **Dynamic greeting** — changes based on time of day
- **Scroll reveal animations** — uses `IntersectionObserver`

### No build / lint / test

There are no build steps, linters, or automated tests. Edits are made directly to the three source files.

### External dependencies

- Google Fonts (Inter, Noto Serif SC, JetBrains Mono) loaded via CDN
- GitHub REST API for project cards (no auth required)
