# France Final Departure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collapse the published A/B itinerary into the confirmed 7 October FR4230 departure.

**Architecture:** Update the static checker first, then remove scenario markup from the itinerary table, finalize transport and hotel states in the planner, and update hub metadata.

**Tech Stack:** Vanilla HTML, CSS, JavaScript, Python standard-library validation.

## Global Constraints

- FR4230 is 7 October 2026, BVA 16:40 → BUD 18:50.
- Do not retain the 6 October flight or any A/B scenario UI.
- Keep all privacy, map, theme, mobile, official-link, and localStorage guarantees.

### Task 1: Enforce the final route

- [ ] Change `scripts/check-travel-pages.py` to require 10 schedule rows, no scenario rows, 15 booking IDs, and the final FR4230 date/time.
- [ ] Run the checker and confirm it fails on the current A/B pages.

### Task 2: Finalize itinerary and planner

- [ ] Remove the duplicate A/B rows from `france-itinerary-2026.html`.
- [ ] Make 10 October 6 the complete Paris day and 10 October 7 the BVA departure day.
- [ ] Update `france-planning-2026.html` to mark FR4230 booked, remove the change-flight task, and fix Paris/Budapest hotel dates.
- [ ] Update `france.html` to remove the scenario description.

### Task 3: Verify and publish

- [ ] Commit and push the final content.
- [ ] Run the structural checker, browser table/mobile tests, official-link audit, and `git diff --check`.
- [ ] Publish the verified commit to `master` and verify GitHub Pages deployment.

### Task 4: Improve mobile navigation and switch to Van Gogh Museum

- [ ] Update the checker to require the Van Gogh booking ID and map destination, ten mobile date links, and bottom navigation on both itinerary and planning pages.
- [ ] Confirm the checker fails on the Rijksmuseum content and missing mobile navigation.
- [ ] Replace the 30 September Rijksmuseum visit and booking task with the Van Gogh Museum at 15:00.
- [ ] Add a mobile-only sticky date strip linking to each dated row.
- [ ] Add a mobile-only bottom switch between itinerary and planning pages.
- [ ] Increase mobile booking-link tap targets and verify no horizontal overflow at 390 pixels.
- [ ] Commit, verify, publish to `master`, and confirm the Pages deployment.

### Task 5: Group the itinerary by function

- [ ] Update the checker to require five table cells and the headers `日期 / 住宿`, `行程`, `交通`, `餐饮`, `预约`.
- [ ] Confirm the old six-column table fails the new requirement.
- [ ] Merge morning, afternoon, and evening activity text into one vertical `day-flow` in each row.
- [ ] Keep transport, restaurant, and booking information in their own functional columns.
- [ ] Adjust desktop widths and verify the same five labels on mobile.
- [ ] Commit, run browser and link checks, publish to `master`, and verify deployment.

### Task 6: Remove redundant itinerary chrome

- [ ] Update the checker to reject the large hero, route line, transport board, booking spotlight, decision note, and “欧洲十日行” copy.
- [ ] Confirm the current page fails those compact-page requirements.
- [ ] Replace the hero with a compact page heading and date.
- [ ] Remove all repeated modules so the date navigation and itinerary table become the primary content.
- [ ] Simplify the travel and France hub labels.
- [ ] Verify the first table row appears near the top on desktop and mobile, then publish to `master`.
