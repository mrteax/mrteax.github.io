# Tea X Content and Privacy Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh time-sensitive content, make health analysis local-only, remove remote visitor tracking, repair confirmed UI/data defects, and add repeatable static validation.

**Architecture:** Keep the site as dependency-free static HTML/CSS/JavaScript. Enforce content and privacy invariants with one Node standard-library checker, then validate rendered pages through a local HTTP server and headless Chrome.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, Node.js standard library, Python static server, headless Chrome, GitHub Pages.

## Global Constraints

- Do not add package-manager dependencies or a build step.
- Do not upload health files or visitor location data.
- Keep France as the clear main destination: 11 hotel nights in France, with one Monaco day trip.
- Do not hard-code a visa-centre street address; link to official sources instead.
- Do not describe `noindex` as access control.
- Use 2026-07-30 as the content review date.

---

### Task 1: Add a failing static regression checker

**Files:**
- Create: `scripts/check-site.mjs`

**Interfaces:**
- Consumes: root HTML files, `js/*-data.js`, production JavaScript and documentation.
- Produces: exit code `0` with `Site checks passed (N checks).`, or exit code `1` with one line per failed invariant.

- [ ] **Step 1: Write the checker with desired-state assertions**

The script must:

```js
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const failures = [];
let checks = 0;
const check = (condition, message) => {
  checks += 1;
  if (!condition) failures.push(message);
};
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const htmlFiles = fs.readdirSync(root).filter(file => file.endsWith('.html'));
for (const file of htmlFiles) {
  const source = read(file);
  const refs = [...source.matchAll(/(?:href|src)=["'](\/[^"'#?]+)(?:[?#][^"']*)?["']/g)];
  for (const match of refs) {
    check(fs.existsSync(path.join(root, match[1].slice(1))), `${file}: missing ${match[1]}`);
  }
  check((source.match(/href=["']\/css\/theme\.css(?:\?[^"']*)?["']/g) || []).length <= 1,
    `${file}: duplicate theme.css`);
}

for (const file of fs.readdirSync(path.join(root, 'js')).filter(file => file.endsWith('.js'))) {
  const result = spawnSync(process.execPath, ['--check', path.join(root, 'js', file)]);
  check(result.status === 0, `js/${file}: invalid JavaScript`);
}

const scanned = [
  ...htmlFiles,
  ...fs.readdirSync(path.join(root, 'js')).filter(file => file.endsWith('.js')).map(file => `js/${file}`),
  'AGENTS.md'
].map(file => [file, read(file)]);
for (const [file, source] of scanned) {
  check(!source.includes('\uFFFD'), `${file}: Unicode replacement character`);
  check(!source.includes('\\${'), `${file}: escaped template interpolation`);
  check(!source.includes('aiUsedInput'), `${file}: obsolete AI input id`);
}

const forbidden = ['trcetesyexopngcfrgck.supabase.co', 'ipwho.is', 'ipapi.co/json', 'visitor-map.js'];
for (const value of forbidden) {
  check(!scanned.some(([, source]) => source.includes(value)), `production source contains ${value}`);
}

const portal = read('portal.html');
check(portal.includes('34 条经典路线'), 'portal: hiking count is not 34');
check(portal.includes('42 个训练动作'), 'portal: fitness count is not 42');
check(portal.includes('国际象棋'), 'portal: game summary omits chess');
check(!portal.includes('/js/coffee-data.js'), 'portal: unused coffee data script');

const france = read('france-schengen-2026.html');
for (const text of ['最后更新：2026-07-30', '递签城市：武汉', '8 月底', '摩纳哥',
  'https://france-visas.gouv.fr/', 'https://home-affairs.ec.europa.eu/']) {
  check(france.includes(text), `france guide: missing ${text}`);
}
check(!france.includes('尽量 6 月内递签'), 'france guide: stale June deadline');
check(france.includes('noindex,nofollow'), 'france guide: missing noindex');
check(read('health.html').includes('noindex,nofollow'), 'health: missing noindex');

const datasets = [
  ['js/hiking-data.js', 'TRAILS', 34],
  ['js/fitness-data.js', 'EXERCISES', 42],
  ['js/tennis-data.js', 'TENNIS_TIPS', 30],
  ['js/skiing-data.js', 'SKI_RESORTS', 25],
  ['js/surfing-data.js', 'SURF_SPOTS', 26],
  ['js/billiards-data.js', 'BILLIARDS_TIPS', 30],
  ['js/tea-data.js', 'TEAS', 30],
  ['js/coffee-data.js', 'COFFEES', 40],
  ['js/cocktails-data.js', 'COCKTAILS', 46]
];
for (const [file, name, expected] of datasets) {
  const context = {};
  vm.createContext(context);
  vm.runInContext(`${read(file)}; this.value = ${name};`, context);
  check(Array.isArray(context.value) && context.value.length === expected,
    `${file}: expected ${expected} records`);
}

for (const obsolete of ['visitors.html', 'js/visitor-map.js', 'js/main.js', 'css/style.css',
  'reference-beside-me-renote.jpg']) {
  check(!fs.existsSync(path.join(root, obsolete)), `${obsolete}: obsolete file still exists`);
}

if (failures.length) {
  console.error(failures.map(failure => `FAIL ${failure}`).join('\n'));
  process.exit(1);
}
console.log(`Site checks passed (${checks} checks).`);
```

- [ ] **Step 2: Commit the checker before running it**

```bash
git add scripts/check-site.mjs
git commit -m "test: add static site regression checks"
git push -u origin cursor/refresh-content-privacy-0de0
```

- [ ] **Step 3: Run it and verify the current site fails**

Run: `node scripts/check-site.mjs`

Expected: non-zero exit with failures including escaped interpolation, Supabase/IP services, stale France timeline, wrong portal counts, and obsolete files.

---

### Task 2: Make personal-data features local-only

**Files:**
- Modify: `portal.html`
- Modify: `js/home.js`
- Modify: `health.html`
- Delete: `visitors.html`
- Delete: `js/visitor-map.js`

**Interfaces:**
- Consumes: a user-selected Health Auto Export JSON file.
- Produces: local parsing, day selection, assessment, trends and export without network requests.

- [ ] **Step 1: Remove visitor tracking from the portal**

Delete `/js/visitor-map.js` from the script list. Change the footer brand link from `/visitors.html` to `/index.html`. Remove weather code in `js/home.js` that depends on `teax_geo` and `teax:geo`; retain the local visit-count greeting.

- [ ] **Step 2: Replace cloud health UI with an explicit local-only introduction**

At the start of `.health-wrap`, use:

```html
<div class="health-card privacy-card">
  <h2>🔒 本地健康分析</h2>
  <p class="hint">选择的 JSON 文件只在当前浏览器中解析，不会发送到 Tea X、Supabase 或其他服务器。</p>
</div>
```

Move `#shareBtn` into the manual-import card and label it `📤 导出最新数据供你主动分享`.

- [ ] **Step 3: Remove remote configuration and sync**

Delete the `SUPA` constant and `cloudSync()` function. Keep format converters (`flatToHAE`, `appleHealthUploaderToHAE`, `normalizeExport`) because local files use them. Remove `lastDataOrigin`; day switching always reports through `#parseMsg`.

After a successful local import, render local trends with:

```js
const series = buildSeries([{ data: norm, created_at: new Date(file.lastModified || Date.now()).toISOString() }]);
renderTrends(series);
```

- [ ] **Step 4: Delete the public visitor dashboard and remote adapter**

Delete `visitors.html` and `js/visitor-map.js`. Confirm no remaining `href` or `script` references.

- [ ] **Step 5: Commit the privacy change**

```bash
git add portal.html js/home.js health.html visitors.html js/visitor-map.js
git commit -m "fix: keep personal data local to the browser"
git push -u origin cursor/refresh-content-privacy-0de0
```

---

### Task 3: Update the France visa guide and itinerary

**Files:**
- Modify: `france-schengen-2026.html`
- Modify: `docs/github-pages-deploy.md`

**Interfaces:**
- Consumes: travel dates 2026-09-25 through 2026-10-07 and an existing late-August Wuhan appointment.
- Produces: a public-safe preparation guide and truthful France-main-destination itinerary.

- [ ] **Step 1: Update metadata and privacy**

Add:

```html
<meta name="robots" content="noindex,nofollow">
```

Set the displayed review date to `2026-07-30`, remove duplicate `theme.css`, and change the chips to Wuhan, late August, and `法国主行程 + 摩纳哥一日游`.

- [ ] **Step 2: Replace stale relative deadlines with an appointment countdown**

Use four concrete phases:

1. `现在完成` — freeze names, dates, itinerary, hotels and transport.
2. `预约前 2 周` — obtain employment, school, retirement, relationship and six-month bank records.
3. `预约前 3 天` — regenerate statements, verify bookings, print final France-Visas forms and receipts.
4. `武汉递签当天` — submit one independently ordered set per applicant and retain scans.

State that official rules allow filing no more than six months before travel and normally require at least 15 days; the current late-August slot is a tight but valid window.

- [ ] **Step 3: Replace the itinerary table**

Use:

| Date | Overnight | Plan |
| --- | --- | --- |
| 9.25 Fri | Flight | Shanghai to Paris |
| 9.26 Sat | Paris | Arrival, Notre-Dame and Seine walk |
| 9.27 Sun | Paris | Louvre timed entry, Tuileries |
| 9.28 Mon | Paris | Eiffel Tower, Arc de Triomphe, relaxed neighbourhood walk |
| 9.29 Tue | Paris | Versailles timed entry |
| 9.30 Wed | Tours/Amboise | Train to Loire Valley |
| 10.1 Thu | Tours/Amboise | Chambord and Chenonceau with one driver/tour |
| 10.2 Fri | Avignon | Rail transfer, old town and Palais des Papes |
| 10.3 Sat | Avignon | One Provence loop, not multiple distant villages |
| 10.4 Sun | Nice | Rail to Nice, old town and promenade |
| 10.5 Mon | Nice | Monaco day trip by TER; overnight remains Nice |
| 10.6 Tue | Paris | Flight to Paris, buffer night |
| 10.7 Wed | Flight | Paris to Shanghai |

- [ ] **Step 4: Update letters and official references**

Use the neutral addressee `Visa Officer, Consulate General of France`. Mention that the trip is primarily in France with a day trip from Nice to Monaco. Add links to France-Visas, the EU main-destination FAQ, the French embassy in China and Visit Monaco.

- [ ] **Step 5: Remove the personal guide from public deployment documentation**

Delete its direct URL from `docs/github-pages-deploy.md`; expand the privacy rule to cover health and travel details.

- [ ] **Step 6: Commit the travel update**

```bash
git add france-schengen-2026.html docs/github-pages-deploy.md
git commit -m "content: update Wuhan visa plan and France itinerary"
git push -u origin cursor/refresh-content-privacy-0de0
```

---

### Task 4: Repair factual, rendering and navigation defects

**Files:**
- Modify: `tea.html`
- Modify: `skiing.html`
- Modify: `surfing.html`
- Modify: `js/skiing-data.js`
- Modify: `tennis.html`
- Modify: `cocktails.html`
- Modify: `games.html`
- Modify: `portal.html`
- Modify: `js/home.js`
- Modify: `tools.html`
- Modify: `cursor-usage-bookmarklet.html`
- Modify: `js/theme-icons.js`

**Interfaces:**
- Consumes: existing data arrays and user theme preference.
- Produces: correctly interpolated cards/modals, accurate reference copy and consistent navigation.

- [ ] **Step 1: Fix escaped templates**

Remove the backslash from every `\${...}` in `tea.html`, `skiing.html` and `surfing.html`.

- [ ] **Step 2: Correct reference data**

Apply these exact content corrections:

- `赤�的温泉` → `赤仓温泉`
- `野�的温泉` → `野泽温泉`
- Aspen Snowmass trails → `413条雪道（四山合计）`
- Park City vertical → `975m落差`
- Park City merger text → Canyons, not Deer Valley
- Cortina text → `曾是2026年冬奥会联合举办地`
- Bar Benfiddich owner → `鹿山博康（Hiroyasu Kayama）`
- Tennis rule → explain ATP Live ELC since 2025 and that other competitions follow event rules

- [ ] **Step 3: Correct portal and game copy**

Set hiking/fitness counts to 34/42. Expand games summary to `骰子 · 谁喝 · 数字炸弹 · 国王 · 真心话大冒险 · 国际象棋`. Change the tab `真大` to `真心话`.

- [ ] **Step 4: Fix interaction details**

Change `aiUsedInput` to `aiProviderInput`. Add Enter/Space handling to the quote button and Escape handling for both portal modals. Add a portal link around the tools-page brand.

- [ ] **Step 5: Make theme initialization shared**

In `theme-icons.js`, read `localStorage.getItem('theme')` or `prefers-color-scheme` when the page has not already run its own initializer. Remove duplicate `theme.css` from the bookmarklet page and add `noindex,nofollow`.

- [ ] **Step 6: Commit the fixes**

```bash
git add tea.html skiing.html surfing.html js/skiing-data.js tennis.html cocktails.html games.html portal.html js/home.js tools.html cursor-usage-bookmarklet.html js/theme-icons.js
git commit -m "fix: refresh reference content and page interactions"
git push -u origin cursor/refresh-content-privacy-0de0
```

---

### Task 5: Remove obsolete assets and update maintenance documentation

**Files:**
- Modify: `AGENTS.md`
- Delete: `js/main.js`
- Delete: `css/style.css`
- Delete: `reference-beside-me-renote.jpg`

**Interfaces:**
- Produces: repository documentation that matches production files and privacy behavior.

- [ ] **Step 1: Rewrite the structure and data notes**

Document `home.js`, `tools.js`, data files, local-only health behavior, external fonts/cocktail images/chess module/weather removal, and the static checker command:

```bash
node scripts/check-site.mjs
```

- [ ] **Step 2: Delete unreferenced files**

Delete `js/main.js`, `css/style.css` and `reference-beside-me-renote.jpg`.

- [ ] **Step 3: Commit maintenance cleanup**

```bash
git add AGENTS.md js/main.js css/style.css reference-beside-me-renote.jpg
git commit -m "chore: remove obsolete site assets"
git push -u origin cursor/refresh-content-privacy-0de0
```

---

### Task 6: Verify the complete site

**Files:**
- Modify only if a verification failure identifies a defect in an earlier task.

**Interfaces:**
- Produces: passing static checks, clean browser smoke results and a clean Git worktree.

- [ ] **Step 1: Run static checks**

Run:

```bash
node scripts/check-site.mjs
```

Expected: `Site checks passed (` followed by a positive check count.

- [ ] **Step 2: Run independent JavaScript syntax checks**

Run:

```bash
for file in js/*.js scripts/*.mjs; do node --check "$file"; done
```

Expected: exit code `0`.

- [ ] **Step 3: Start the site in tmux**

Run:

```bash
SESSION_NAME=teax-refresh-server
tmux -f /exec-daemon/tmux.portal.conf new-session -d -s "$SESSION_NAME" -c "$PWD" -- python3 -m http.server 8080
```

- [ ] **Step 4: Smoke-test rendered pages**

For `portal.html`, `tea.html`, `skiing.html`, `surfing.html`, `health.html`, and `france-schengen-2026.html`, run Chrome with a unique temporary profile and a 15-second timeout. Assert that dumped DOM contains each page title and does not contain `${`, `�`, `正在从云端读取`, or `6 月内递签`.

- [ ] **Step 5: Verify external source availability without sending personal data**

Issue read-only HEAD/GET checks for France-Visas, EU Home Affairs, French embassy China, Visit Monaco, Google Fonts, jsDelivr chess.js and a sample CocktailDB image. Expected: HTTP 2xx/3xx.

- [ ] **Step 6: Stop the static server and inspect the diff**

Run:

```bash
tmux -f /exec-daemon/tmux.portal.conf kill-session -t teax-refresh-server
git diff --check
git status --short
```

Expected: no whitespace errors; only intended changes before the final commit.

- [ ] **Step 7: Commit any verification fixes and push**

```bash
git add -A
git commit -m "fix: address site verification findings"
git push -u origin cursor/refresh-content-privacy-0de0
```

Skip the commit only when verification made no changes.
