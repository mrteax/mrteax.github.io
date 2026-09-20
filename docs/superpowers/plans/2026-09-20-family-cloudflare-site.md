# Family Cloudflare Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate a standalone family itinerary site that Cloudflare Pages can deploy without exposing links to the personal Tea X homepage.

**Architecture:** A Python build script derives `dist/family-trip/index.html` from the canonical itinerary on every deployment, removes all internal navigation, rewrites assets to relative paths, and copies only the required CSS, JavaScript, and favicon. A separate checker builds into a temporary directory and validates privacy isolation, content parity, assets, and Cloudflare headers.

**Tech Stack:** Python standard library, vanilla HTML/CSS/JavaScript, Cloudflare Pages Git integration.

## Global Constraints

- Keep `france-itinerary-2026.html` as the single source of itinerary content.
- Publish no links to the Tea X homepage, planning page, visa page, or GitHub.
- Preserve all map and reservation links, responsive layout, and theme switching.
- Add `noindex`, `nofollow`, and `noarchive` directives.
- Use no new runtime dependencies.

---

### Task 1: Family site validator

**Files:**
- Create: `scripts/check-family-share.py`

**Interfaces:**
- Consumes: `scripts/build-family-share.py`, canonical itinerary and static assets.
- Produces: a zero-exit validation command suitable for local and Cloudflare build checks.

- [ ] Write checks that build into a temporary directory and require `index.html`, three CSS files, `travel-theme.js`, `pack-preview.png`, and `_headers`.
- [ ] Require all ten itinerary rows, map URL generation, reservation links, relative asset URLs, and the robots directive.
- [ ] Reject internal Tea X navigation, root-relative URLs, GitHub references, and copied planning/visa pages.
- [ ] Run `python3 scripts/check-family-share.py` and verify it fails because the builder is missing.

### Task 2: Standalone family build

**Files:**
- Create: `scripts/build-family-share.py`
- Create: `.gitignore`

**Interfaces:**
- Produces: `build_family_site(output_dir: Path) -> Path` and CLI option `--output`.

- [ ] Read `france-itinerary-2026.html`, replace the top bar with a family-only title and theme toggle, and remove both lower navigation blocks.
- [ ] Rewrite favicon, CSS, and JavaScript paths to relative URLs; remove the shared `theme-icons.js` script.
- [ ] Add robots metadata and Cloudflare `_headers`, then copy only required assets.
- [ ] Ignore generated `dist/` output.
- [ ] Run `python3 scripts/check-family-share.py` and the existing travel checker; require both to pass.

### Task 3: Cloudflare setup guide and browser verification

**Files:**
- Create: `docs/family-cloudflare-deployment.md`

**Interfaces:**
- Documents the exact Pages project fields and deletion procedure.

- [ ] Document production branch `master`, build command `python3 scripts/build-family-share.py`, and output directory `dist/family-trip`.
- [ ] Document the one-time Cloudflare GitHub authorization and the post-trip project deletion path.
- [ ] Build locally, serve the output, and verify desktop/mobile rendering, map links, external bookings, and absence of personal navigation.
- [ ] Run both checkers, commit, push, and publish the changes to `master`.
