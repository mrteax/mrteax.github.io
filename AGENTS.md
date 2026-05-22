## Cursor Cloud specific instructions

This repository is a **static Hexo blog** containing only pre-built output (HTML, CSS, JS, fonts, images). There is no `package.json`, no build system, no test suite, and no linting configuration.

### Running the site

Serve the repository root with any static HTTP server:

```bash
cd /workspace && python3 -m http.server 8080
```

Then browse to `http://localhost:8080/`. Key pages:

- `/` — homepage with post listing
- `/archives/` — archive page
- `/tags/` — tags page
- `/2015/05/19/hello-world/` — the single blog post

### No build / lint / test

There are no build steps, linters, or automated tests. All assets are pre-compiled and vendored (jQuery 2.1.3, Velocity.js, Fancybox 2.1.5, Lato font, icon fonts).

### Making changes

Edits are made directly to the static HTML/CSS/JS files. There is no source-to-output compilation step in this repo.
