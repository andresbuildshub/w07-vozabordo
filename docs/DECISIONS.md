# Decisions — w07-vozabordo

> Session close ritual, every session: one line per decision with the why, tomorrow's first move at the top, commit, push. This file is where the Week 12 Extraction gets mined from.

**Tomorrow's first move:** (filled at session close)

---

<!-- newest first: YYYY-MM-DD — decision — why -->
- 2026-09-23 — Pipeline writes JSON with `allow_nan=False`; crashes off-route → `null` — the first test run crashed: pandas wrote `NaN` (invalid JSON) for the 1,733 crashes not on any corridor.
- 2026-09-23 — Power simulation: route rate fixed across periods (EB estimate), Poisson noise only — first version redrew the gamma rate per period and made everything look unmeasurable (e.g. 23% power at 136 routes/33%); that mixes between-route spread into within-route noise.
- 2026-09-23 — Minimum group size 11 estimated units (GTFS cycle time / headway) — a ramal of 8 is identifiable; same k as Week 6. 92 of 137 routes pass; Z1's GTFS (23 trips × 4.5 min headway → 492 units) marked implausible.
- 2026-09-23 — Measure on SSC "hechos de tránsito" (vehicle type MICROBUS), not C5 "incidentes viales" — C5's data dictionary has no vehicle-type field (checked 09-23); the fight's worry confirmed.
- 2026-09-23 — No telemetry, no complaint channel, QR = route + batch only — brief's shadow decisions (phone-off = confession; passenger rating = the Uber rating).
- 2026-09-23 — Build before the T7 Blueprint, from the brief's surviving slice — course allows "their own surviving idea"; conditions table gets remapped when the Blueprint exists.
- 2026-09-23 — Print CSS: 2×2 grid, rows fixed at 122 mm, QR 36 mm (first try with 1fr rows overflowed to 2 pages, 2 per page) — mechanical pass (Playwright page.pdf) showed the 4 stickers using only the top 40% of the sheet, too small to read in a moving micro.
- 2026-09-23 — Map: top-10 routes thick red and drawn last, other 82 thin/translucent — screenshot at 390 px showed the red routes buried under orange, so the legend's promise wasn't visible.
- 2026-09-23 — `.vercelignore` for `data-raw` — first prod deploy failed: CLI uploads the local folder, including the raw-data symlink.
