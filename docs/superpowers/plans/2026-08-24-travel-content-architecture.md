# Travel Content Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a continent-filtered travel index, a France country hub, and separate visa, planning, and dated-itinerary pages while removing current-state companion details from all public content.

**Architecture:** Keep the repository static and dependency-free. `travel.html` owns continent filtering, `france.html` owns country-level navigation, and three focused HTML pages own visa, planning, and itinerary content. Existing URLs become compatibility gateways, while a small shared stylesheet provides consistent travel-page cards, navigation, map icons, and responsive behavior.

**Tech Stack:** Vanilla HTML5, CSS, JavaScript, localStorage, Python standard-library verification scripts, GitHub Pages.

## Global Constraints

- Do not introduce a package manager, build tool, framework, database, or external API.
- Preserve Tea X light/dark theme behavior with `css/themes.css` and `css/theme.css`.
- Do not expose actual companion count, age, school year, family relationship, or individual visa/travel-history details.
- Keep generic applicant categories: employed applicant, minor applicant, retired applicant, shared materials.
- Preserve generic child pricing and accessibility guidance.
- Every itinerary location must have a visible `📍` icon and a Google Maps Search link.
- Preserve old URLs through compatibility pages.
- Do not rewrite Git history.

---

### Task 1: Shared travel-page presentation

**Files:**
- Create: `css/travel.css`
- Modify: `travel.html`
- Create: `scripts/check-travel-pages.py`

**Interfaces:**
- Consumes: Tea X variables from `css/theme.css` and component conventions from `css/themes.css`.
- Produces: `.travel-hero`, `.continent-filters`, `.country-grid`, `.content-grid`, `.content-card`, `.map-link`, `.page-nav`, `.empty-state`.

- [ ] **Step 1: Add a failing structural checker**

Create `scripts/check-travel-pages.py` with:

```python
from html.parser import HTMLParser
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = {
    "travel.html": ["continent-filters", 'data-continent="europe"', "/france.html"],
    "france.html": ["/france-visa-2026.html", "/france-planning-2026.html", "/france-itinerary-2026.html"],
    "france-itinerary-2026.html": ['class="map-link"', 'data-q='],
}

class Balance(HTMLParser):
    VOID = {"meta", "link", "br", "img", "input", "hr", "source", "area", "base", "embed", "param", "track", "wbr"}
    def __init__(self):
        super().__init__()
        self.stack = []
        self.errors = []
    def handle_starttag(self, tag, attrs):
        if tag not in self.VOID:
            self.stack.append(tag)
    def handle_endtag(self, tag):
        if not self.stack or self.stack[-1] != tag:
            self.errors.append(f"unexpected </{tag}> after {self.stack[-3:]}")
        else:
            self.stack.pop()

errors = []
for filename, needles in REQUIRED.items():
    path = ROOT / filename
    if not path.exists():
        errors.append(f"missing {filename}")
        continue
    text = path.read_text(encoding="utf-8")
    for needle in needles:
        if needle not in text:
            errors.append(f"{filename}: missing {needle}")
    parser = Balance()
    parser.feed(text)
    if parser.stack or parser.errors:
        errors.append(f"{filename}: HTML balance {parser.stack} {parser.errors}")

if errors:
    print("\n".join(errors))
    sys.exit(1)
print("travel page structure: OK")
```

- [ ] **Step 2: Run the checker and verify it fails**

Run:

```bash
python3 scripts/check-travel-pages.py
```

Expected: non-zero exit with missing `france.html`, `france-itinerary-2026.html`, or continent-filter markup.

- [ ] **Step 3: Add focused shared styles**

Create `css/travel.css` with theme-variable-based rules for:

```css
.travel-shell{max-width:1100px;margin:0 auto;padding:16px 16px 56px}
.travel-hero{padding:24px 20px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-card)}
.continent-filters{display:flex;gap:7px;flex-wrap:wrap;margin:18px 0}
.continent-tag{border:1px solid var(--border);border-radius:999px;background:var(--bg-card);color:var(--text-2);padding:7px 12px;cursor:pointer}
.continent-tag.active{background:var(--text);color:var(--bg);border-color:var(--text)}
.country-grid,.content-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}
.content-card{display:block;padding:18px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-card);color:var(--text);text-decoration:none}
.content-card:hover{transform:translateY(-2px);box-shadow:var(--shadow)}
.empty-state{display:none;padding:40px;text-align:center;color:var(--text-3)}
.map-link{display:inline-flex;align-items:center;gap:3px;color:inherit;text-decoration:none;border-bottom:1px dotted var(--text-3)}
.map-link::before{content:"📍";font-size:.85em}
.page-nav{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:16px}
@media(max-width:600px){.country-grid,.content-grid{grid-template-columns:1fr}}
```

- [ ] **Step 4: Link `css/travel.css` from every new travel page**

Add:

```html
<link rel="stylesheet" href="/css/travel.css">
```

after the existing theme stylesheets.

- [ ] **Step 5: Commit the shared presentation**

```bash
git add css/travel.css scripts/check-travel-pages.py
git commit -m "feat: add shared travel page presentation"
```

---

### Task 2: Continent-filtered travel index and France hub

**Files:**
- Modify: `travel.html`
- Create: `france.html`
- Modify: `js/home.js`
- Modify: `portal.html`

**Interfaces:**
- Consumes: `.continent-tag`, `.country-grid`, and `.content-card` from Task 1.
- Produces: country cards with `data-continent`, and links to the three France content pages.

- [ ] **Step 1: Rewrite `travel.html` as a country index**

Use this filter contract:

```html
<div class="continent-filters" role="group" aria-label="按大洲筛选">
  <button class="continent-tag active" data-filter="all">全部</button>
  <button class="continent-tag" data-filter="europe">欧洲</button>
  <button class="continent-tag" data-filter="asia">亚洲</button>
  <button class="continent-tag" data-filter="north-america">北美洲</button>
  <button class="continent-tag" data-filter="south-america">南美洲</button>
  <button class="continent-tag" data-filter="africa">非洲</button>
  <button class="continent-tag" data-filter="oceania">大洋洲</button>
</div>
<div class="country-grid" id="countryGrid">
  <a class="content-card country-card" data-continent="europe" href="/france.html">
    <span class="card-emoji">🇫🇷</span>
    <h2>法国</h2>
    <p>巴黎 · 普罗旺斯 · 蔚蓝海岸</p>
    <span class="card-badge">3 个页面</span>
  </a>
</div>
<div class="empty-state" id="emptyState">这个大洲还没有内容</div>
```

Add filtering JavaScript:

```javascript
const tags = document.querySelectorAll('.continent-tag');
const cards = document.querySelectorAll('.country-card');
const empty = document.getElementById('emptyState');
tags.forEach(tag => tag.addEventListener('click', () => {
  const filter = tag.dataset.filter;
  tags.forEach(item => item.classList.toggle('active', item === tag));
  let visible = 0;
  cards.forEach(card => {
    const show = filter === 'all' || card.dataset.continent === filter;
    card.hidden = !show;
    if (show) visible++;
  });
  empty.style.display = visible ? 'none' : 'block';
}));
```

Remove the party-composition chip and the France-specific countdown from the top-level travel index.

- [ ] **Step 2: Create `france.html`**

Create a country hero with date and route only, plus three equal cards:

```html
<a class="content-card" href="/france-visa-2026.html">
  <span class="card-emoji">🛂</span><h2>签证准备</h2>
  <p>申请步骤、匿名身份材料清单、英文模板与递签排序。</p>
</a>
<a class="content-card" href="/france-planning-2026.html">
  <span class="card-emoji">✅</span><h2>行前规划</h2>
  <p>机票、火车、住宿、门票、保险与官方预约入口。</p>
</a>
<a class="content-card" href="/france-itinerary-2026.html">
  <span class="card-emoji">🗓️</span><h2>行程安排</h2>
  <p>按日期查看每天路线，并直接打开 Google Maps 定位。</p>
</a>
```

Use a privacy-safe countdown that only emits `距出发还有 N 天`, `行程进行中`, or `行程已结束`.

- [ ] **Step 3: Update portal copy**

Keep the existing “旅行” exploration card but change dynamic copy to:

```javascript
if (today < depart) el.textContent = `法国 · ${Math.round((depart - today) / DAY)} 天后出发`;
else if (today <= back) el.textContent = '法国 · 行程进行中';
else el.textContent = '法国 · 行程回顾';
```

Ensure the card still points to `/travel.html`.

- [ ] **Step 4: Run structural checker**

Run:

```bash
python3 scripts/check-travel-pages.py
node --check js/home.js
```

Expected: checker may still fail only for the not-yet-created itinerary page; Node syntax check passes.

- [ ] **Step 5: Commit index and hub**

```bash
git add travel.html france.html portal.html js/home.js
git commit -m "feat: add continent filter and France travel hub"
```

---

### Task 3: Privacy-safe visa preparation page

**Files:**
- Create: `france-visa-2026.html`
- Modify: `france-schengen-2026.html`

**Interfaces:**
- Consumes: existing visa page content and the country navigation from Task 2.
- Produces: anonymous applicant sections and generic sponsor templates.

- [ ] **Step 1: Copy the visual shell of the existing visa page**

Create `france-visa-2026.html` using the existing styles, then replace navigation with:

```html
<nav class="topbar">
  <a href="/france.html">← 法国</a>
  <a href="/france-planning-2026.html">行前规划 →</a>
</nav>
```

- [ ] **Step 2: Rewrite role-specific headings**

Use exactly:

```html
<h3>在职申请人</h3>
<h3>未成年申请人</h3>
<h3>退休申请人</h3>
<h3>共享材料</h3>
```

Replace relationship-specific requirements with reusable wording:

```html
<li>如由他人承担费用：费用担保信、担保人的在职与资金证明。</li>
<li>未成年申请人：出生证明、在读或准假证明、监护人身份证明。</li>
<li>退休申请人：退休证明、养老金或银行流水。</li>
<li>如需证明监护、担保或亲属关系：按签证中心清单准备公证或户籍材料。</li>
```

- [ ] **Step 3: Generalize English templates**

The sponsorship list must use repeatable placeholders only:

```text
1. [APPLICANT FULL NAME], [RELATIONSHIP OR ROLE], passport number [PASSPORT NUMBER]
2. [APPLICANT FULL NAME], [RELATIONSHIP OR ROLE], passport number [PASSPORT NUMBER]
```

Remove references to a spouse's existing visa, named family structure, and combined travel history.

- [ ] **Step 4: Convert old visa URL into a gateway**

Replace `france-schengen-2026.html` body with a small page containing:

```html
<meta http-equiv="refresh" content="0; url=/france-visa-2026.html">
<link rel="canonical" href="/france-visa-2026.html">
<p>页面已移动到<a href="/france-visa-2026.html">签证准备</a>。</p>
```

- [ ] **Step 5: Scan the new visa page**

Run:

```bash
rg -n "父亲|母亲|父母|太太|妻子|一年级|5 人|五人|70 岁|7 岁" france-visa-2026.html
```

Expected: no output.

- [ ] **Step 6: Commit visa split**

```bash
git add france-visa-2026.html france-schengen-2026.html
git commit -m "feat: add privacy-safe France visa preparation page"
```

---

### Task 4: Booking-focused planning page

**Files:**
- Create: `france-planning-2026.html`

**Interfaces:**
- Consumes: booking, transport, tickets, practicalities, accessibility, and safety sections from `france-trip-2026.html`.
- Produces: official booking actions with checkboxes stored under `teax-france-2026-planning`.

- [ ] **Step 1: Create planning-page navigation and contents**

Use:

```html
<nav class="topbar">
  <a href="/france.html">← 法国</a>
  <a href="/france-itinerary-2026.html">行程安排 →</a>
</nav>
```

The table of contents must include:

```html
<a href="#booking">1. 优先预订</a>
<a href="#flights">2. 国际航班</a>
<a href="#rail">3. 境内交通</a>
<a href="#stay">4. 住宿</a>
<a href="#tickets">5. 门票与预约</a>
<a href="#comfort">6. 舒适度与无障碍</a>
<a href="#practical">7. 落地实务</a>
<a href="#safety">8. 安全与应急</a>
<a href="#pack">9. 打包清单</a>
```

- [ ] **Step 2: Normalize every booking action**

Every P0/P1 item must have:

```html
<span class="booking-window">建议：立即预订</span>
<span class="booking-rule">必须预约</span>
<a class="official-link" href="OFFICIAL_URL" target="_blank" rel="noopener">官网预订 ↗</a>
```

Use official URLs already researched:

- Air France: `https://www.airfrance.com.cn`
- China Eastern: `https://www.ceair.com`
- SNCF: `https://www.sncf-connect.com`
- Eiffel Tower: `https://ticket.toureiffel.paris/en`
- Louvre: `https://ticket.louvre.fr/en`
- Versailles: `https://ticket.chateauversailles.fr`
- Orsay: `https://billetterie.musee-orsay.fr`
- CMN: `https://www.monuments-nationaux.fr`
- Notre-Dame: `https://www.notredamedeparis.fr`

- [ ] **Step 3: Generalize planning copy**

Apply these replacements contextually, not as blind global substitutions:

```text
老人 + 小孩专项 -> 舒适度与无障碍提示
两位老人 -> 希望减少步行或需要无障碍设施的游客
7 岁小孩 -> 儿童游客
5 个人 -> 多人同行
你们家 -> 本次行程
让小孩 -> 可让儿童游客
```

Remove all actual-group total prices. Keep per-person adult/child prices and rules.

- [ ] **Step 4: Use the new localStorage key**

```javascript
const KEY = 'teax-france-2026-planning';
```

Keep the current checkbox serialization behavior.

- [ ] **Step 5: Verify privacy and booking links**

Run:

```bash
rg -n "太太|父母|父亲|母亲|一年级|5 人|五人|70 岁|7 岁|4 人" france-planning-2026.html
rg -o 'class="official-link"' france-planning-2026.html | wc -l
```

Expected: first command has no output; second count is at least 9.

- [ ] **Step 6: Commit planning page**

```bash
git add france-planning-2026.html
git commit -m "feat: add booking-focused France planning page"
```

---

### Task 5: Dated itinerary with visible map pins

**Files:**
- Create: `france-itinerary-2026.html`
- Modify: `france-trip-2026.html`

**Interfaces:**
- Consumes: the 12 dated `.day` blocks from the existing guide.
- Produces: one Google Maps Search URL per `.map-link[data-q]`.

- [ ] **Step 1: Create itinerary navigation and summary**

Use:

```html
<nav class="topbar">
  <a href="/france.html">← 法国</a>
  <a href="/france-planning-2026.html">行前规划与预约 →</a>
</nav>
```

Add a short note: “涉及定时票的项目请先在行前规划页完成预约。”

- [ ] **Step 2: Move the 12 dated day blocks**

Retain date, weekday, city, time, activity, transport, closure, and event information. Remove planning-only flight comparison tables, ticket-budget tables, insurance, customs, and packing sections.

- [ ] **Step 3: Convert location links to visible pins**

Every location anchor must use:

```html
<a class="map-link" data-q="Tour Eiffel, Paris">埃菲尔铁塔</a>
```

and JavaScript:

```javascript
document.querySelectorAll('.map-link[data-q]').forEach(link => {
  link.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(link.dataset.q);
  link.target = '_blank';
  link.rel = 'noopener';
  link.title = `在 Google Maps 中打开：${link.textContent.trim()}`;
});
```

The `📍` is emitted by `.map-link::before` from Task 1.

- [ ] **Step 4: Generalize companion-specific notes**

Use generic wording:

```text
行动不便者可乘小火车
儿童游客可能更喜欢王后村庄
需要减少台阶者可在二层结束参观
多人同行应预留更长的登车时间
```

Do not state actual count, age, grade, or family relationship.

- [ ] **Step 5: Convert old combined URL into a gateway**

Replace `france-trip-2026.html` with a compatibility page containing two prominent cards:

```html
<a href="/france-planning-2026.html">行前规划与预约</a>
<a href="/france-itinerary-2026.html">按日期查看行程</a>
```

Do not auto-redirect because the old combined URL has two valid destinations.

- [ ] **Step 6: Verify maps and dated structure**

Run:

```bash
python3 scripts/check-travel-pages.py
python3 - <<'PY'
from pathlib import Path
import re
text = Path("france-itinerary-2026.html").read_text()
days = len(re.findall(r'class="day-date"', text))
maps = len(re.findall(r'class="map-link"[^>]*data-q=', text))
assert days == 12, days
assert maps >= 50, maps
print(f"itinerary: {days} days, {maps} map links")
PY
```

Expected: `travel page structure: OK` and at least 50 map links across 12 dated sections.

- [ ] **Step 7: Commit itinerary split**

```bash
git add france-itinerary-2026.html france-trip-2026.html
git commit -m "feat: add dated France itinerary with map pins"
```

---

### Task 6: Public-source privacy scrub and final verification

**Files:**
- Modify: `docs/france-2026-transport-research.md`
- Modify: `docs/france-trip-2026-research.md`
- Modify: `docs/loire-provence-riviera-research-oct-2026.md`
- Modify: `docs/paris-2026-family-trip-research.md`
- Modify: `portal.html`
- Modify: `travel.html`
- Modify: `france.html`
- Modify: `france-visa-2026.html`
- Modify: `france-planning-2026.html`
- Modify: `france-itinerary-2026.html`

**Interfaces:**
- Consumes: all public travel content.
- Produces: privacy scan with zero actual-companion disclosures.

- [ ] **Step 1: Add a privacy scanner**

Extend `scripts/check-travel-pages.py`:

```python
PRIVACY_FILES = [
    "travel.html", "france.html", "france-visa-2026.html",
    "france-planning-2026.html", "france-itinerary-2026.html",
    "docs/france-2026-transport-research.md",
    "docs/france-trip-2026-research.md",
    "docs/loire-provence-riviera-research-oct-2026.md",
    "docs/paris-2026-family-trip-research.md",
]
FORBIDDEN = [
    r"你\s*\+\s*太太", r"两位老人", r"一年级", r"5\s*人", r"五人",
    r"70\s*岁", r"7\s*岁", r"父亲：", r"母亲", r"父母：",
    r"4\s*[×x]\s*[^=]+\+\s*", r"4\s*位成人",
]
for filename in PRIVACY_FILES:
    text = (ROOT / filename).read_text(encoding="utf-8")
    for pattern in FORBIDDEN:
        if re.search(pattern, text):
            errors.append(f"{filename}: privacy pattern {pattern}")
```

- [ ] **Step 2: Run scanner and capture failures**

Run:

```bash
python3 scripts/check-travel-pages.py
```

Expected: failures listing the remaining research-document disclosures.

- [ ] **Step 3: Scrub research-document framing and calculations**

For each research document:

- Change the party description to “Chinese travellers using a France-issued Schengen visa”.
- Change family-specific recommendations to “travellers seeking lower walking intensity or child-friendly options”.
- Remove actual-group ticket totals while keeping adult and child unit prices.
- Remove references to spouse visa status, school year, exact senior ages, and exact passenger count.
- Preserve source URLs, verified/secondary/advice tags, dates, prices, schedules, and open questions.

- [ ] **Step 4: Run all static checks**

Run:

```bash
python3 scripts/check-travel-pages.py
node --check js/home.js
python3 -m http.server 8080
```

In a second shell:

```bash
for path in \
  portal.html travel.html france.html \
  france-visa-2026.html france-planning-2026.html france-itinerary-2026.html \
  france-schengen-2026.html france-trip-2026.html \
  css/travel.css js/home.js; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:8080/$path")
  test "$code" = 200 || { echo "$path $code"; exit 1; }
done
echo "all travel routes: HTTP 200"
```

Expected: all checkers pass, Node syntax passes, all URLs return 200.

- [ ] **Step 5: Check the diff for accidental content loss**

Run:

```bash
git diff --stat master...HEAD
git diff --check
```

Expected: no whitespace errors; new pages and privacy edits are present.

- [ ] **Step 6: Commit verification and privacy scrub**

```bash
git add scripts/check-travel-pages.py docs/ portal.html travel.html france.html \
  france-visa-2026.html france-planning-2026.html france-itinerary-2026.html \
  france-schengen-2026.html france-trip-2026.html css/travel.css js/home.js
git commit -m "fix: remove companion details from public travel content"
```

- [ ] **Step 7: Push and update the pull request**

```bash
git push -u origin cursor/travel-content-architecture-25b2
```

Update PR #10 with the final page map, privacy scope, compatibility behavior, and verification results, then mark it ready for review.
