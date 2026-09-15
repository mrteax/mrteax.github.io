# France Two-Scenario Itinerary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the outdated France itinerary and planning content with the current Amsterdam–Nice–Paris–Budapest route, a 6/7 October side-by-side branch, and direct official booking links.

**Architecture:** Keep the existing static HTML/CSS/JavaScript travel architecture. Extend the shared Python structure checker first, then rebuild the two content pages using semantic day and booking components, and finally update route metadata on the travel hubs.

**Tech Stack:** Vanilla HTML, CSS, JavaScript, Python standard-library validation.

## Global Constraints

- Do not expose traveler names, ages, family composition, order numbers, Ctrip share URLs, tokens, or collaborators.
- Show 10 dated sections from 29 September through 8 October 2026.
- Show 6 and 7 October as two responsive scenario columns.
- Treat U27953 and OUIGO 7856 as awaiting confirmation; do not label them booked.
- Preserve theme switching, local-only checklist persistence, Google Maps links, and official HTTPS booking links.
- Add no dependencies or build tools.

---

### Task 1: Update structural expectations

**Files:**
- Modify: `scripts/check-travel-pages.py`

**Interfaces:**
- Consumes: semantic HTML classes used by the travel pages.
- Produces: a nonzero exit for old route content and zero for the completed pages.

- [ ] **Step 1: Change the itinerary expectations before production HTML**

Set the required day count to 10, require route text `阿姆斯特丹`, `尼斯`, `巴黎`, and `布达佩斯`, require two `.scenario-card` children for both 6 October and 7 October, and replace the booking inventory with:

```python
EXPECTED_BOOKING_IDS = {
    "book-ams-stay", "book-nice-stay", "book-paris-stay",
    "book-budapest-stay", "book-ams-nce", "book-nice-paris",
    "book-paris-budapest-change", "book-rijksmuseum",
    "book-bellet", "book-picasso", "book-orsay", "book-louvre",
    "book-garnier", "book-eiffel", "book-sainte-chapelle",
    "book-seine-cruise",
}
```

- [ ] **Step 2: Run the checker and verify RED**

Run: `python3 scripts/check-travel-pages.py`

Expected: FAIL because the old page has 12 days, no scenario cards, and the old booking IDs.

- [ ] **Step 3: Keep the failing checker uncommitted until HTML is implemented**

Do not weaken date, privacy, booking-link, or HTML-balance checks to make old content pass.

---

### Task 2: Rebuild the itinerary page and travel presentation

**Files:**
- Modify: `france-itinerary-2026.html`
- Modify: `css/travel.css`

**Interfaces:**
- Consumes: `/css/themes.css`, `/css/theme.css`, `/js/travel-theme.js`, `/js/theme-icons.js`.
- Produces: 10 semantic `.day` sections, `.scenario-grid` and `.scenario-card` comparison UI, and Google Maps links generated from `data-q`.

- [ ] **Step 1: Replace old route metadata**

Use:

```html
<div class="eyebrow">Europe · 2026.09.29–10.09</div>
<h1>欧洲十日行</h1>
<p>阿姆斯特丹 → 尼斯与昂蒂布 → 巴黎 → 布达佩斯</p>
```

- [ ] **Step 2: Add the verified transport strip**

Render CZ3504, CZ307, U27953, OUIGO 7856, FR4230, CZ650 and CZ3550 without order numbers. Mark confirmed international flights and FR4230 as booked, and U27953/OUIGO 7856 as awaiting confirmation.

- [ ] **Step 3: Build shared date cards**

Create one `.day` section for each date from 29 September through 5 October. Include:

```text
9.29 Shanghai–Guangzhou same-night transfer
9.30 Amsterdam canals, Nine Streets, Rijksmuseum
10.1 Amsterdam morning, U27953 to Nice
10.2 Nice old town, Cours Saleya, Château de Bellet
10.3 Antibes market, Picasso Museum, OUIGO 7856
10.4 Montmartre, Sacré-Cœur, Musée d'Orsay
10.5 Louvre, Palais Garnier, French food and wine dinner
```

- [ ] **Step 4: Build the two-column branch**

For 6 and 7 October, render two `.scenario-card` columns:

```text
A: Eiffel Tower, leave central Paris about 15:00, FR4230 from BVA;
   full Budapest day on 7 October.
B: Eiffel Tower, Arc de Triomphe, Seine cruise on 6 October;
   Notre-Dame/Île de la Cité on 7 October, flight details awaiting confirmation.
```

- [ ] **Step 5: Add responsive editorial styling**

Add route-line, booking-state, city-kicker, scenario-grid, reservation-card, and print styles. Use:

```css
.scenario-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; }
@media (max-width: 720px) { .scenario-grid { grid-template-columns:1fr; } }
```

- [ ] **Step 6: Run the checker**

Run: `python3 scripts/check-travel-pages.py`

Expected: still FAIL only on the planning inventory and hub metadata.

---

### Task 3: Rebuild the booking planner

**Files:**
- Modify: `france-planning-2026.html`

**Interfaces:**
- Consumes: official operator URLs and the itinerary dates.
- Produces: 16 `.booking-item` records, each with one checkbox, metadata, description, and official link.

- [ ] **Step 1: Replace the hero and status summary**

Show the route dates and three states:

```text
已预订：international flights and current FR4230
待确认：U27953 and OUIGO 7856
条件项：10 October 7 Paris–Budapest change
```

- [ ] **Step 2: Add transport and hotel bookings**

Create the first seven checklist entries using the exact IDs in Task 1. Provide official links to easyJet, SNCF Connect, Ryanair, and official city accommodation directories.

- [ ] **Step 3: Add shared attraction bookings**

Create the fixed-date entries:

```text
30 Sep Rijksmuseum around 14:00
2 Oct Château de Bellet at 14:00
3 Oct Picasso Museum at 10:00
4 Oct Musée d'Orsay around 14:00
5 Oct Louvre at 09:00
5 Oct Palais Garnier at 14:30 or 15:00
6 Oct Eiffel Tower at 09:00
```

- [ ] **Step 4: Add conditional bookings**

Add Sainte-Chapelle and Seine cruise as deferred items whose dates depend on the Paris–Budapest decision or weather.

- [ ] **Step 5: Reset checklist persistence**

Use:

```javascript
const KEY = 'teax-france-2026-v2-planning';
```

Keep invalid-JSON and unavailable-storage handling.

- [ ] **Step 6: Run the checker**

Run: `python3 scripts/check-travel-pages.py`

Expected: planning inventory and booking-link checks pass; only hub metadata may remain.

---

### Task 4: Update hubs, remove obsolete private branch artifacts, and verify

**Files:**
- Modify: `france.html`
- Modify: `travel.html`
- Delete: `docs/visa/France_Schengen_Itinerary_2026-09-21_to_2026-10-10.txt`
- Delete: `docs/visa/France_Schengen_Itinerary_2026_final.pdf`

**Interfaces:**
- Consumes: final route and dates.
- Produces: consistent navigation metadata and a PR diff without unrelated hotel booking references.

- [ ] **Step 1: Update route metadata**

Use `2026.09.29 – 10.09` and `阿姆斯特丹 → 尼斯与昂蒂布 → 巴黎 → 布达佩斯` on the France hub. Update the travel country card to the same route.

- [ ] **Step 2: Remove obsolete visa files from the branch**

Delete the two files because they contain an outdated route and hotel booking references unrelated to the public travel pages.

- [ ] **Step 3: Run all static verification**

Run:

```bash
python3 scripts/check-travel-pages.py
python3 -m http.server 8080
```

Verify HTTP 200 for `/travel.html`, `/france.html`, `/france-planning-2026.html`, and `/france-itinerary-2026.html`.

- [ ] **Step 4: Manually verify desktop and mobile**

Confirm both scenario columns are side by side on desktop and stacked on a 390-pixel viewport; test theme switching, map links, checklist persistence, and external official links.

- [ ] **Step 5: Commit**

```bash
git add scripts/check-travel-pages.py css/travel.css france-itinerary-2026.html \
  france-planning-2026.html france.html travel.html docs/visa
git commit -m "feat: update France itinerary with two departure options"
```

- [ ] **Step 6: Push and update the pull request**

Run: `git push -u origin cursor/france-trip-guide-2026-25b2`

Update the PR title and description to describe the current route, two scenarios, shared reservation dates, and privacy-safe content.

---

### Task 5: Convert the daily timeline to a table

**Files:**
- Modify: `scripts/check-travel-pages.py`
- Modify: `france-itinerary-2026.html`
- Modify: `css/travel.css`

**Interfaces:**
- Consumes: the verified route, restaurant research, existing map-link JavaScript, and reservation cards.
- Produces: one `.itinerary-table`, 12 `.schedule-row` records covering 10 unique dates, four scenario rows, and responsive card rendering.

- [ ] **Step 1: Update the checker before changing markup**

Require one `.itinerary-table`, 12 `.schedule-row` elements, the 10 unique `data-date` values from `9.29` through `10.8`, four `.scenario-row` elements, and at least six `.restaurant-link` elements.

- [ ] **Step 2: Run the checker and verify RED**

Run: `python3 scripts/check-travel-pages.py`

Expected: FAIL because the current page still uses timeline sections and scenario cards.

- [ ] **Step 3: Replace timeline markup**

Use six table columns:

```text
日期与住宿 | 交通 | 上午 | 下午 | 晚上与餐厅 | 需要预约
```

Use one shared row per date and A/B child rows for 6 and 7 October.

- [ ] **Step 4: Add researched restaurant recommendations**

Use The Pantry, Chez Acchiardo, Marché Provençal, Bouillon Pigalle, Au Petit Riche, Ô Chateau, and Menza. Include recommended dishes, current price bands, opening-day compatibility, and map or official links.

- [ ] **Step 5: Add responsive styling**

Keep a sticky header and first column on desktop. Below 760 pixels, hide the table header and display each row as a labeled card using `td::before { content: attr(data-label); }`.

- [ ] **Step 6: Verify and publish**

Run the static checker, desktop and 390-pixel browser assertions, official-link audit, and `git diff --check`; commit, push, update the PR, and publish the verified revision to `master`.
