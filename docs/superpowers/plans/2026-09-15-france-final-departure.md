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
